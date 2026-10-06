// app/api/users/[id]/approve/route.ts
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
    const authResult = await requireSuperadmin()
    if (!authResult.ok) return authResult.error

    const body = await request.json()
    const { role } = body

    if (!role || !ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: 'Se requiere un rol válido para aprobar al usuario' }, { status: 400 })
    }

    // 3. Usar cliente admin para actualizar perfil
    const adminSupabase = createAdminClient()
    const { data: updatedProfile, error } = await (adminSupabase
      .from('user_profiles') as any)
      .update({
        is_active: true,
        role: role,
      })
      .eq('id', targetUserId)
      .select('*')
      .single()

    if (error) {
      console.error('[POST /api/users/[id]/approve] Database update error:', error)
      return NextResponse.json({ success: false, error: 'Error al actualizar el perfil del usuario' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile
    })

  } catch (err) {
    console.error('[POST /api/users/[id]/approve] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
