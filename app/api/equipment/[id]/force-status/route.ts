// app/api/equipment/[id]/force-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { forceStatusSchema } from '@/lib/validations/equipment.schema'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params
    // 1. Crear el cliente normal para verificar sesión y rol RLS
    const normalSupabase = await createServerClient()

    // 2. Verificar sesión
    const { data: { session } } = await normalSupabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 3. Obtener perfil
    const { data: userProfile } = await normalSupabase
      .from('user_profiles')
      .select('username, role, is_active, is_superadmin')
      .eq('id', session.user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ success: false, error: 'Perfil de usuario no encontrado' }, { status: 404 })
    }

    const activeProfile = userProfile as any

    if (!activeProfile.is_active) {
      return NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 })
    }

    // 4. Doble verificación de Superadmin
    if (activeProfile.role !== 'superadmin' || !activeProfile.is_superadmin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado. Solo el superadmin puede forzar estados' }, { status: 403 })
    }

    // 5. Validar body con Zod
    const body = await request.json()
    const parsed = forceStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de override inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { new_status_id, override_reason } = parsed.data

    // 6. Verificar que el estado destino existe
    const { data: targetState, error: stateError } = await normalSupabase
      .from('workflow_states')
      .select('name, color')
      .eq('id', new_status_id)
      .single()

    if (stateError || !targetState) {
      return NextResponse.json({ success: false, error: 'El estado destino no existe en el workflow' }, { status: 404 })
    }

    const activeTargetState = targetState as any

    // 7. Verificar que el equipo existe
    const { data: equipment, error: eqError } = await normalSupabase
      .from('equipment_records')
      .select('current_status_id')
      .eq('id', equipmentId)
      .single()

    if (eqError || !equipment) {
      return NextResponse.json({ success: false, error: 'Equipo no encontrado' }, { status: 404 })
    }

    const activeEquipment = equipment as any

    // Obtener nombre del estado anterior para el log manual de override
    const { data: previousState } = await normalSupabase
      .from('workflow_states')
      .select('name')
      .eq('id', activeEquipment.current_status_id)
      .single()

    const activePrevState = previousState as any

    // 8. Crear cliente Admin con service_role para hacer el bypass de RLS en la escritura directa del log y equipo
    const adminSupabase = createAdminClient()

    // 9. Actualizar el estado del equipo
    const { error: updateError } = await (adminSupabase
      .from('equipment_records') as any)
      .update({
        current_status_id: new_status_id,
        additional_observations: `FORZADO POR SUPERADMIN: ${override_reason.trim().toUpperCase()}`,
      })
      .eq('id', equipmentId)

    if (updateError) {
      console.error('[POST force-status] Database update error:', updateError)
      return NextResponse.json({ success: false, error: 'Ocurrió un error al forzar el estado del equipo' }, { status: 500 })
    }

    // 10. Escribir entrada manual en el historial para documentar el override con la razón obligatoria
    const { error: historyError } = await (adminSupabase
      .from('status_history') as any)
      .insert({
        equipment_id: equipmentId,
        previous_status: activePrevState?.name || 'DESCONOCIDO',
        new_status: activeTargetState.name,
        changed_by_id: session.user.id,
        changed_by_username: activeProfile.username,
        is_override: true,
        override_reason: override_reason.trim().toUpperCase(),
      })

    if (historyError) {
      console.error('[POST force-status] Error writing status history:', historyError)
      // No fallamos la petición entera porque el estado del equipo ya cambió
    }

    return NextResponse.json({
      success: true,
      data: {
        new_status_name: activeTargetState.name,
        new_status_color: activeTargetState.color,
      }
    })

  } catch (err) {
    console.error('[POST force-status] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
