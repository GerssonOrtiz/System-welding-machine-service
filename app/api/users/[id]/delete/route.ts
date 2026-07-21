// app/api/users/[id]/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE(
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
      return NextResponse.json({ success: false, error: 'Acceso denegado. Solo el superadmin puede eliminar usuarios' }, { status: 403 })
    }

    // Prevent deleting oneself
    if (targetUserId === session.user.id) {
      return NextResponse.json({ success: false, error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // Check if target user is superadmin
    const { data: targetProfile, error: fetchError } = await adminSupabase
      .from('user_profiles')
      .select('is_superadmin')
      .eq('id', targetUserId)
      .single()

    if (fetchError || !targetProfile) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 })
    }

    const activeTarget = targetProfile as any
    if (activeTarget.is_superadmin) {
      return NextResponse.json({ success: false, error: 'No se puede eliminar al superadmin' }, { status: 403 })
    }

    // 3. Eliminar de Auth (lo cual gatilla Cascade a user_profiles)
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(targetUserId)

    if (deleteError) {
      console.error('[DELETE /api/users/[id]/delete] Auth delete error:', deleteError)
      return NextResponse.json({ success: false, error: 'Error al eliminar al usuario del sistema de autenticación' }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (err) {
    console.error('[DELETE /api/users/[id]/delete] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
