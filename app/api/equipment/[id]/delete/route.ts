import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { canDeleteEquipment } from '@/types/user'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authResult = await requireAuth('role, is_active')
    if (!authResult.ok) return authResult.error
    const { supabase, profile } = authResult.ctx

    // 3. Verificar permisos de eliminación
    if (!canDeleteEquipment(profile.role as any)) {
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
