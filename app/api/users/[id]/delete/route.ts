// app/api/users/[id]/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/api/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
    // 1. Verificar sesión y permisos de superadmin
    const authResult = await requireSuperadmin()
    if (!authResult.ok) return authResult.error
    const { userId } = authResult.ctx

    // Prevent deleting oneself
    if (targetUserId === userId) {
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
