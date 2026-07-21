// app/api/equipment/[id]/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // 1. Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Obtener perfil
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', session.user.id)
      .single()

    const activeProfile = userProfile as any

    if (!activeProfile?.is_active) {
      return NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 })
    }

    // 3. Verificar permisos de eliminación (solo superadmin y admin)
    const allowedRoles = ['superadmin', 'admin']
    if (!allowedRoles.includes(activeProfile.role)) {
      return NextResponse.json({ success: false, error: 'No cuentas con permisos para eliminar equipos' }, { status: 403 })
    }

    const equipmentId = id

    // 4. Verificar si el equipo existe antes de borrar
    const { data: equipment } = await supabase
      .from('equipment_records')
      .select('id')
      .eq('id', equipmentId)
      .single()

    if (!equipment) {
      return NextResponse.json({ success: false, error: 'Equipo no encontrado' }, { status: 404 })
    }

    // 5. Eliminar equipo (la BD tiene ON DELETE CASCADE para status_history)
    const { error: deleteError } = await supabase
      .from('equipment_records')
      .delete()
      .eq('id', equipmentId)

    if (deleteError) {
      console.error('[DELETE /api/equipment/[id]/delete] Error deleting equipment:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Ocurrió un error al intentar eliminar el equipo de la base de datos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[DELETE /api/equipment/[id]/delete] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
