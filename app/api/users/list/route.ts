// app/api/users/list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ success: false, error: 'Acceso denegado. Solo el superadmin puede listar usuarios' }, { status: 403 })
    }

    // 3. Obtener clientes admin para ver auth.users (service_role)
    const adminSupabase = createAdminClient()
    const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers()

    if (authError) {
      console.error('[GET /api/users/list] Auth list error:', authError)
      return NextResponse.json({ success: false, error: 'Error al consultar usuarios del sistema de autenticación' }, { status: 500 })
    }

    // 4. Obtener todos los perfiles de la base de datos
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('user_profiles')
      .select('*')

    if (profilesError) {
      console.error('[GET /api/users/list] Profiles fetch error:', profilesError)
      return NextResponse.json({ success: false, error: 'Error al consultar perfiles de la base de datos' }, { status: 500 })
    }

    // 5. Mapear y unir
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    const data = authData.users.map((authUser) => {
      const dbProfile = profileMap.get(authUser.id) || {} as any
      return {
        id: authUser.id,
        username: dbProfile.username || 'SIN_PERFIL',
        email: authUser.email || 'sin_email@cabelab.com',
        role: dbProfile.role || 'pendiente',
        is_active: !!dbProfile.is_active,
        is_superadmin: !!dbProfile.is_superadmin,
        created_at: dbProfile.created_at || authUser.created_at,
      }
    })

    return NextResponse.json({
      success: true,
      data
    })

  } catch (err) {
    console.error('[GET /api/users/list] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
