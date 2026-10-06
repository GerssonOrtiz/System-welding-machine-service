// app/api/users/[id]/update-role/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireSuperadmin } from '@/lib/api/auth'
import { ASSIGNABLE_ROLES } from '@/types/user'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
    // 1. Verificar sesión y permisos de superadmin
    const authResult = await requireSuperadmin()
    if (!authResult.ok) return authResult.error

    const body = await request.json()
    const { role } = body

    if (!role || !ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: 'Se requiere un rol válido' }, { status: 400 })
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
      return NextResponse.json({ success: false, error: 'No se puede modificar el rol del superadmin' }, { status: 403 })
    }

    // 3. Actualizar rol
    const { data: updatedProfile, error } = await (adminSupabase
      .from('user_profiles') as any)
      .update({
        role: role,
      })
      .eq('id', targetUserId)
      .select('*')
      .single()

    if (error) {
      console.error('[POST /api/users/[id]/update-role] Database update error:', error)
      return NextResponse.json({ success: false, error: 'Error al cambiar el rol del usuario' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile
    })

  } catch (err) {
    console.error('[POST /api/users/[id]/update-role] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
