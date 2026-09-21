// app/api/users/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { adminCreateUserSchema } from '@/lib/validations/user.schema'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Verificar que el usuario sea superadmin activo
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, is_active, is_superadmin')
      .eq('id', session.user.id)
      .single()

    const activeProfile = userProfile as any
    if (!activeProfile || !activeProfile.is_active) {
      return NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 })
    }

    if (activeProfile.role !== 'superadmin' || !activeProfile.is_superadmin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado. Solo el superadmin puede crear usuarios' }, { status: 403 })
    }

    // 3. Validar cuerpo de la petición
    const body = await request.json()
    const validation = adminCreateUserSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Datos de usuario inválidos'
      return NextResponse.json({ success: false, error: firstError }, { status: 400 })
    }

    const { username, password, role } = validation.data
    const normalizedUsername = username.toLowerCase().trim()
    const virtualEmail = `${normalizedUsername}@cabelab.local`

    const adminSupabase = createAdminClient()

    // 4. Comprobar si ya existe el username en user_profiles
    const { data: existingUser } = await adminSupabase
      .from('user_profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'El nombre de usuario ya está registrado' }, { status: 400 })
    }

    // 5. Crear usuario en Supabase Auth usando admin API
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email: virtualEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: normalizedUsername,
      },
    })

    if (authError || !authUser.user) {
      console.error('[POST /api/users/create] Auth error:', authError)
      return NextResponse.json({ success: false, error: authError?.message || 'Error al crear usuario en autenticación' }, { status: 500 })
    }

    // 6. El trigger on_auth_user_created crea la fila en user_profiles.
    // Procedemos a actualizar el perfil asignándole el rol elegido y activándolo de inmediato.
    const { data: updatedProfile, error: profileError } = await (adminSupabase
      .from('user_profiles') as any)
      .update({
        role: role,
        is_active: true,
      })
      .eq('id', authUser.user.id)
      .select('*')
      .single()

    if (profileError) {
      console.error('[POST /api/users/create] Profile update error:', profileError)
      return NextResponse.json({ success: false, error: 'Usuario creado pero falló la asignación de rol' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: authUser.user.id,
        username: normalizedUsername,
        email: virtualEmail,
        role: role,
        is_active: true,
      },
    })
  } catch (err) {
    console.error('[POST /api/users/create] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
