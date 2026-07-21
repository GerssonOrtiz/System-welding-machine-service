// app/api/equipment/[id]/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { updateStatusSchema } from '@/lib/validations/equipment.schema'
import { WorkflowEngine } from '@/lib/workflow/engine'
import { mailer } from '@/lib/mail/mailer'

export async function POST(
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

    // 2. Obtener perfil
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('username, role, is_active')
      .eq('id', session.user.id)
      .single()

    const activeProfile = userProfile as any

    if (!activeProfile?.is_active) {
      return NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 })
    }

    // 3. Validar body con Zod
    const body = await request.json()
    const parsed = updateStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de actualización inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { new_status_id, assigned_technician_ids, notes, report_number } = parsed.data

    // 4. Verificar existencia de equipo
    const { data: equipment, error: eqError } = await supabase
      .from('equipment_records')
      .select('current_status_id')
      .eq('id', equipmentId)
      .single()

    if (eqError || !equipment) {
      return NextResponse.json({ success: false, error: 'Equipo no encontrado' }, { status: 404 })
    }

    const activeEquipment = equipment as any

    // 5. Verificar si el equipo ya está en estado terminal
    const isTerminal = await WorkflowEngine.isTerminal(activeEquipment.current_status_id)
    if (isTerminal) {
      return NextResponse.json({ success: false, error: 'El equipo ya está en estado terminal y no puede avanzar' }, { status: 422 })
    }

    // 6. Obtener los detalles del estado destino
    const { data: targetState, error: targetError } = await supabase
      .from('workflow_states')
      .select('name, color')
      .eq('id', new_status_id)
      .single()

    const activeTargetState = targetState as any

    if (targetError || !activeTargetState) {
      return NextResponse.json({ success: false, error: 'El estado destino seleccionado no existe en el workflow' }, { status: 404 })
    }

    // 7. Validar transiciones según motor de workflow
    const validation = await WorkflowEngine.validateTransition(
      activeEquipment.current_status_id,
      new_status_id,
      activeProfile.role
    )

    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.error || 'Transición de estado no permitida' }, { status: 422 })
    }

    // 8. Validaciones específicas del negocio
    const isDiagnosis = activeTargetState.name.trim().toLowerCase() === 'en diagnóstico'
    const isMaintenance = activeTargetState.name.trim().toLowerCase() === 'en mantenimiento'

    if (isDiagnosis || isMaintenance) {
      if (!assigned_technician_ids || assigned_technician_ids.length === 0) {
        return NextResponse.json({ success: false, error: 'El técnico asignado es requerido para cambiar a este estado' }, { status: 400 })
      }
    }

    // 9. Actualizar el equipo en la BD
    const updateData: Record<string, any> = {
      current_status_id: new_status_id,
      additional_observations: notes?.trim().toUpperCase() || null,
    }

    // Si el estado es de aprobación y no hay número de informe, generamos uno interno
    const isTargetApproval = activeTargetState.name.trim().toLowerCase() === 'pendiente de aprobación' || activeTargetState.name.trim().toLowerCase() === 'aprobado'
    
    if (isTargetApproval && !report_number) {
      updateData.report_number = `INT-${Date.now()}`
    } else if (report_number) {
      updateData.report_number = report_number.trim().toUpperCase()
    }

    if (assigned_technician_ids && assigned_technician_ids.length > 0) {
      updateData.assigned_technician_ids = assigned_technician_ids
    }

    const { error: updateError } = await (supabase
      .from('equipment_records') as any)
      .update(updateData)
      .eq('id', equipmentId)

    if (updateError) {
      console.error('[POST update-status] Database update error:', updateError)
      return NextResponse.json({ success: false, error: 'Ocurrió un error al actualizar el estado del equipo en la base de datos' }, { status: 500 })
    }

    // 10. Enviar Notificaciones Internas (Email) según estado
    try {
      // Necesitamos los datos del equipo para el correo
      const { data: eqFull } = await supabase
        .from('equipment_records')
        .select('fr_number, client_name, brand, model')
        .eq('id', equipmentId)
        .single()

      if (eqFull) {
        const full = eqFull as any
        const statusName = activeTargetState.name.trim().toLowerCase()

        if (statusName === 'aprobado') {
          mailer.sendEquipmentApproved({
            fr_number: full.fr_number,
            client_name: full.client_name,
            brand: full.brand,
            model: full.model
          })
        } else if (statusName.includes('repuesto')) {
          mailer.sendPartsRequest({
            fr_number: full.fr_number,
            client_name: full.client_name,
            brand: full.brand,
            model: full.model,
            status: activeTargetState.name
          })
        }
      }
    } catch (mailErr) {
      console.error('[POST update-status] Background mailer error:', mailErr)
    }

    return NextResponse.json({
      success: true,
      data: {
        new_status_name: activeTargetState.name,
        new_status_color: activeTargetState.color,
      }
    })

  } catch (err) {
    console.error('[POST update-status] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
