// app/api/users/[id]/block/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/api/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
    // 1. Verificar sesión y permisos de superadmin
    const authResult = await requireSuperadmin()
    if (!authResult.ok) return authResult.error
    const { userId } = authResult.ctx

    // Prevent blocking oneself
    if (targetUserId === userId) {
      return NextResponse.json({ success: false, error: 'No puedes bloquearte a ti mismo' }, { status: 400 })
    }

    // Check if the target user is superadmin
    const adminSupabase = createAdminClient()
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
      return NextResponse.json({ success: false, error: 'No se puede bloquear al superadmin del sistema' }, { status: 403 })
    }

    // 3. Bloquear usuario
    const { data: updatedProfile, error } = await (adminSupabase
      .from('user_profiles') as any)
      .update({
        is_active: false,
      })
      .eq('id', targetUserId)
      .select('*')
      .single()

    if (error) {
      console.error('[POST /api/users/[id]/block] Database update error:', error)
      return NextResponse.json({ success: false, error: 'Error al bloquear al usuario' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile
    })

  } catch (err) {
    console.error('[POST /api/users/[id]/block] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
