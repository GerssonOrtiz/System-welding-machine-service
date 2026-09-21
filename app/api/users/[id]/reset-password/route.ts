// app/api/users/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { adminResetPasswordSchema } from '@/lib/validations/user.schema'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
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
      return NextResponse.json({ success: false, error: 'Acceso denegado. Solo el superadmin puede restablecer contraseñas' }, { status: 403 })
    }

    // 3. Validar payload
    const body = await request.json()
    const validation = adminResetPasswordSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Contraseña inválida'
      return NextResponse.json({ success: false, error: firstError }, { status: 400 })
    }

    const { newPassword } = validation.data
    const adminSupabase = createAdminClient()

    // 4. Verificar que el usuario objetivo exista
    const { data: targetProfile, error: fetchError } = await adminSupabase
      .from('user_profiles')
      .select('id, username')
      .eq('id', targetUserId)
      .single()

    if (fetchError || !targetProfile) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    // 5. Actualizar la contraseña en Supabase Auth
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('[POST /api/users/[id]/reset-password] Auth update error:', updateError)
      return NextResponse.json({ success: false, error: updateError.message || 'Error al restablecer la contraseña' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Contraseña de ${targetProfile.username} actualizada correctamente`,
    })
  } catch (err) {
    console.error('[POST /api/users/[id]/reset-password] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
