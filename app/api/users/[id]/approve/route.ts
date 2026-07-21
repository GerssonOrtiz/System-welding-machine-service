// app/api/users/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

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
      return NextResponse.json({ success: false, error: 'Acceso denegado. Solo el superadmin puede aprobar usuarios' }, { status: 403 })
    }

    const body = await request.json()
    const { role } = body

    const validRoles = ['admin', 'operaciones', 'recepcion', 'almacen', 'visualizador']
    if (!role || !validRoles.includes(role)) {
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
