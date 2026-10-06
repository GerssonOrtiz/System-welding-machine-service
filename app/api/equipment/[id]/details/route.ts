import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { WorkflowEngine } from '@/lib/workflow/engine'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params
    const authResult = await requireAuth('role, is_active')
    if (!authResult.ok) return authResult.error
    const { supabase, profile } = authResult.ctx

    // 3. Buscar el detalle del equipo
    const { data: equipment, error: eqError } = await supabase
      .from('equipment_with_status')
      .select('*')
      .eq('id', equipmentId)
      .single()

    if (eqError || !equipment) {
      return NextResponse.json({ success: false, error: 'Equipo no encontrado' }, { status: 404 })
    }

    const activeEquipment = equipment as any

    // 4. Buscar historial del equipo ordenado cronológicamente por timestamp descendente
    const { data: history, error: histError } = await supabase
      .from('status_history')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('timestamp', { ascending: false })

    if (histError) {
      console.error('[GET /api/equipment/[id]/details] Error fetching status history:', histError)
      return NextResponse.json({ success: false, error: 'Error al consultar el historial del equipo' }, { status: 500 })
    }

    // 5. Cargar los siguientes estados posibles según la configuración del workflow y el rol del usuario
    const nextStates = await WorkflowEngine.getNextStates(activeEquipment.current_status_id, profile.role)

    // El usuario puede avanzar si no está en un estado terminal y tiene estados posibles de destino configurados
    const isTerminal = await WorkflowEngine.isTerminal(activeEquipment.current_status_id)
    const canAdvance = !isTerminal && nextStates.length > 0

    return NextResponse.json({
      success: true,
      data: {
        equipment: activeEquipment,
        history: history || [],
        next_states: nextStates,
        can_advance: canAdvance,
      }
    })

  } catch (err) {
    console.error('[GET /api/equipment/[id]/details] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
