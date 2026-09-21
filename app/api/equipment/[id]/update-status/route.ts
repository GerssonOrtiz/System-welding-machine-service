// app/api/equipment/[id]/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { WorkflowEngine } from '@/lib/workflow/engine'
import { mailer } from '@/lib/mail/mailer'
import {
  updateStatusSchema,
  informeODPSchema,
  aprobacionVentasSchema,
  entregaLogisticaSchema,
  culminadoODPSchema,
} from '@/lib/validations/equipment.schema'

// Estados que disparan correos específicos (en minúsculas para comparación)
const ESTADO_INFORME_ODP       = 'pendiente de aprobación'
const ESTADO_APROBACION_VENTAS = 'aprobado'
const ESTADO_ENTREGA_LOGISTICA = 'en espera de repuesto'
const ESTADO_CULMINADO_ODP     = 'listo para entrega'

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

    // 3. Detectar si viene como FormData (informe ODP con PDF) o JSON
    const contentType = request.headers.get('content-type') ?? ''
    const isFormData = contentType.includes('multipart/form-data')

    // ── Parseo del body ──────────────────────────────────────────────────────
    let rawBody: Record<string, any> = {}
    let pdfBuffer: Buffer | null = null
    let pdfFilename = 'informe.pdf'

    if (isFormData) {
      const formData = await request.formData()
      formData.forEach((value, key) => {
        if (key !== 'pdf') rawBody[key] = value
      })
      // Parsear campos JSON que vienen como string en FormData
      if (typeof rawBody.new_status_id === 'string') rawBody.new_status_id = parseInt(rawBody.new_status_id, 10)
      const pdfFile = formData.get('pdf') as File | null
      if (pdfFile) {
        pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())
        pdfFilename = pdfFile.name
      }
    } else {
      rawBody = await request.json()
    }

    // 4. Parseo base — siempre necesitamos new_status_id
    const baseSchema = updateStatusSchema.pick({ new_status_id: true })
    const baseParsed = baseSchema.safeParse(rawBody)
    if (!baseParsed.success) {
      return NextResponse.json({ success: false, error: 'ID de estado inválido' }, { status: 400 })
    }
    const { new_status_id } = baseParsed.data

    // 5. Obtener datos del equipo (incluyendo thread y cc para los correos)
    const { data: equipment, error: eqError } = await supabase
      .from('equipment_records')
      .select('current_status_id, fr_number, client_name, brand, model, serial_number, email_thread_id, email_cc')
      .eq('id', equipmentId)
      .single()

    if (eqError || !equipment) {
      return NextResponse.json({ success: false, error: 'Equipo no encontrado' }, { status: 404 })
    }
    const eq = equipment as any

    // 6. Verificar terminal
    const isTerminal = await WorkflowEngine.isTerminal(eq.current_status_id)
    if (isTerminal) {
      return NextResponse.json(
        { success: false, error: 'El equipo ya está en estado terminal y no puede avanzar' },
        { status: 422 }
      )
    }

    // 7. Estado anterior y destino
    const { data: previousState } = await supabase
      .from('workflow_states').select('name').eq('id', eq.current_status_id).single()
    const previousStateName = (previousState as any)?.name ?? null

    const { data: targetState, error: targetError } = await supabase
      .from('workflow_states').select('name, color').eq('id', new_status_id).single()
    if (targetError || !targetState) {
      return NextResponse.json({ success: false, error: 'Estado destino no existe' }, { status: 404 })
    }
    const targetName: string = (targetState as any).name
    const targetNameLower = targetName.trim().toLowerCase()

    // 8. Validar transición
    const validation = await WorkflowEngine.validateTransition(eq.current_status_id, new_status_id, activeProfile.role)
    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.error || 'Transición no permitida' }, { status: 422 })
    }

    // 9. Validación específica de técnico (diagnóstico / mantenimiento)
    const isDiagnosis   = targetNameLower === 'en diagnóstico'
    const isMaintenance = targetNameLower === 'en mantenimiento'
    if (isDiagnosis || isMaintenance) {
      const techIds = rawBody.assigned_technician_ids
      if (!techIds || !Array.isArray(techIds) || techIds.length === 0) {
        return NextResponse.json({ success: false, error: 'El técnico asignado es requerido para este estado' }, { status: 400 })
      }
    }

    // 10. Validación específica por tipo de evento de correo
    if (targetNameLower === ESTADO_INFORME_ODP) {
      const parsed = informeODPSchema.safeParse(rawBody)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Faltan datos del informe ODP', details: parsed.error.flatten() }, { status: 400 })
      }
      if (!pdfBuffer) {
        return NextResponse.json({ success: false, error: 'El PDF del informe es obligatorio' }, { status: 400 })
      }
    }

    if (targetNameLower === ESTADO_APROBACION_VENTAS) {
      const parsed = aprobacionVentasSchema.safeParse(rawBody)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Faltan datos de aprobación de ventas', details: parsed.error.flatten() }, { status: 400 })
      }
    }

    if (targetNameLower === ESTADO_ENTREGA_LOGISTICA) {
      const parsed = entregaLogisticaSchema.safeParse(rawBody)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Faltan datos de entrega logística', details: parsed.error.flatten() }, { status: 400 })
      }
    }

    if (targetNameLower === ESTADO_CULMINADO_ODP) {
      const parsed = culminadoODPSchema.safeParse(rawBody)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Datos de culminado inválidos', details: parsed.error.flatten() }, { status: 400 })
      }
    }

    // 11. Construir payload de actualización
    const updateData: Record<string, any> = {
      current_status_id: new_status_id,
      additional_observations: rawBody.notes?.trim().toUpperCase() || null,
    }

    const isTargetApproval = targetNameLower === 'pendiente de aprobación' || targetNameLower === 'aprobado'
    if (isTargetApproval && !rawBody.report_number) {
      updateData.report_number = `INT-${Date.now()}`
    } else if (rawBody.report_number) {
      updateData.report_number = String(rawBody.report_number).trim().toUpperCase()
    }

    if (rawBody.assigned_technician_ids && Array.isArray(rawBody.assigned_technician_ids) && rawBody.assigned_technician_ids.length > 0) {
      updateData.assigned_technician_ids = rawBody.assigned_technician_ids
    }

    // 12. Actualizar BD
    const { error: updateError } = await (supabase.from('equipment_records') as any)
      .update(updateData)
      .eq('id', equipmentId)

    if (updateError) {
      console.error('[POST update-status] DB update error:', updateError)
      return NextResponse.json({ success: false, error: 'Error al actualizar el estado' }, { status: 500 })
    }

    // 13. Disparar correo específico según el estado destino (fire-and-forget)
    const threadBase = {
      fr_number:    eq.fr_number,
      client_name:  eq.client_name,
      brand:        eq.brand,
      model:        eq.model,
      serial_number: eq.serial_number,
      thread_id:    eq.email_thread_id ?? '',
      email_cc:     eq.email_cc ?? [],
    }

    if (eq.email_thread_id) {
      // Solo enviamos reply si existe un hilo (equipo tiene correo de ingreso registrado)
      if (targetNameLower === ESTADO_INFORME_ODP && pdfBuffer) {
        const parsed = informeODPSchema.parse(rawBody)
        mailer.sendInformeODP({
          ...threadBase,
          diagnostico:  parsed.diagnostico,
          pdf_buffer:   pdfBuffer,
          pdf_filename: pdfFilename,
        }).catch(err => console.error('[update-status] sendInformeODP error:', err))

      } else if (targetNameLower === ESTADO_APROBACION_VENTAS) {
        const parsed = aprobacionVentasSchema.parse(rawBody)
        mailer.sendAprobacionVentas({
          ...threadBase,
          items:         parsed.items,
          observaciones: parsed.observaciones,
        }).catch(err => console.error('[update-status] sendAprobacionVentas error:', err))

      } else if (targetNameLower === ESTADO_ENTREGA_LOGISTICA) {
        const parsed = entregaLogisticaSchema.parse(rawBody)
        mailer.sendEntregaLogistica({
          ...threadBase,
          items:         parsed.items,
          observaciones: parsed.observaciones,
        }).catch(err => console.error('[update-status] sendEntregaLogistica error:', err))

      } else if (targetNameLower === ESTADO_CULMINADO_ODP) {
        const parsed = culminadoODPSchema.parse(rawBody)
        mailer.sendCulminadoODP({
          ...threadBase,
          observaciones: parsed.observaciones,
        }).catch(err => console.error('[update-status] sendCulminadoODP error:', err))
      }
      // Otros estados (en diagnóstico, en mantenimiento, etc.) no disparan correo
    }

    return NextResponse.json({
      success: true,
      data: {
        new_status_name:  targetName,
        new_status_color: (targetState as any).color,
      },
    })

  } catch (err) {
    console.error('[POST update-status] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
