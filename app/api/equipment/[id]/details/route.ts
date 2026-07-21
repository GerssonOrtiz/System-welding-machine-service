// app/api/equipment/[id]/details/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { WorkflowEngine } from '@/lib/workflow/engine'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params
    const supabase = await createServerClient()

    // 1. Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Verificar cuenta activa
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', session.user.id)
      .single()

    const activeProfile = userProfile as any

    if (!activeProfile?.is_active) {
      return NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 })
    }

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
    const nextStates = await WorkflowEngine.getNextStates(activeEquipment.current_status_id, activeProfile.role)

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
