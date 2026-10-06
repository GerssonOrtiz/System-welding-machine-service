import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
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
    const authResult = await requireAuth('username, role, is_active')
    if (!authResult.ok) return authResult.error
    const { supabase, profile } = authResult.ctx

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
      if (typeof rawBody.assigned_technician_ids === 'string') {
        try {
          rawBody.assigned_technician_ids = JSON.parse(rawBody.assigned_technician_ids)
        } catch {
          rawBody.assigned_technician_ids = []
        }
      }
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

    // 5. Obtener datos del equipo (incluyendo thread_id para los correos)
    const { data: equipment, error: eqError } = await supabase
      .from('equipment_records')
      .select('current_status_id, fr_number, client_name, brand, model, serial_number, email_thread_id')
      .eq('id', equipmentId)
      .single()

    if (eqError) {
      // PGRST116 es el código de PostgREST para "JSON object requested, multiple (or no) rows returned"
      if (eqError.code === 'PGRST116' || !equipment) {
        return NextResponse.json({ success: false, error: 'Equipo no encontrado' }, { status: 404 })
      }
      console.error('[POST update-status] Error fetching equipment:', eqError)
      return NextResponse.json({ success: false, error: 'Error al consultar el equipo en la base de datos' }, { status: 500 })
    }

    if (!equipment) {
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
    const validation = await WorkflowEngine.validateTransition(eq.current_status_id, new_status_id, profile.role)
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
      status_change_notes: rawBody.notes?.trim() || null,
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

    if (rawBody.report_url !== undefined) {
      updateData.report_url = rawBody.report_url?.trim() || null
    }

    // 12. Actualizar BD
    const { error: updateError } = await (supabase.from('equipment_records') as any)
      .update(updateData)
      .eq('id', equipmentId)

    if (updateError) {
      console.error('[POST update-status] DB update error:', updateError)
      return NextResponse.json({ success: false, error: 'Error al actualizar el estado' }, { status: 500 })
    }

    // 13. Disparar correo específico según el estado destino si corresponde
    const threadBase = {
      fr_number:    eq.fr_number,
      client_name:  eq.client_name,
      brand:        eq.brand,
      model:        eq.model,
      serial_number: eq.serial_number,
      thread_id:    eq.email_thread_id ?? '',
    }

    let mailWarning: string | null = null
    const requiresEmail =
      targetNameLower === ESTADO_INFORME_ODP ||
      targetNameLower === ESTADO_APROBACION_VENTAS ||
      targetNameLower === ESTADO_ENTREGA_LOGISTICA ||
      targetNameLower === ESTADO_CULMINADO_ODP

    if (requiresEmail) {
      if (!eq.email_thread_id) {
        mailWarning = 'El equipo no tiene un hilo de correo previo registrado, por lo que no se pudo enviar la notificación en hilo.'
      } else {
        console.log('[POST update-status] Despachando notificación en hilo:', {
          equipmentId,
          targetName,
          email_thread_id: eq.email_thread_id,
        })
        try {
          let mailResult: { success: boolean; skipped?: boolean; error?: string } = { success: true }

          if (targetNameLower === ESTADO_INFORME_ODP && pdfBuffer) {
            const parsed = informeODPSchema.parse(rawBody)
            mailResult = await mailer.sendInformeODP({
              ...threadBase,
              diagnostico:  parsed.diagnostico,
              pdf_buffer:   pdfBuffer,
              pdf_filename: pdfFilename,
            })
          } else if (targetNameLower === ESTADO_APROBACION_VENTAS) {
            const parsed = aprobacionVentasSchema.parse(rawBody)
            mailResult = await mailer.sendAprobacionVentas({
              ...threadBase,
              items:         parsed.items,
              observaciones: parsed.observaciones,
            })
          } else if (targetNameLower === ESTADO_ENTREGA_LOGISTICA) {
            const parsed = entregaLogisticaSchema.parse(rawBody)
            mailResult = await mailer.sendEntregaLogistica({
              ...threadBase,
              items:         parsed.items,
              observaciones: parsed.observaciones,
            })
          } else if (targetNameLower === ESTADO_CULMINADO_ODP) {
            const parsed = culminadoODPSchema.parse(rawBody)
            mailResult = await mailer.sendCulminadoODP({
              ...threadBase,
              observaciones: parsed.observaciones,
            })
          }

          if (!mailResult.success && !mailResult.skipped) {
            mailWarning = mailResult.error || 'Ocurrió un error al despachar la notificación por correo.'
          }
        } catch (mailErr: any) {
          console.error('[POST update-status] Error sending email notification:', mailErr)
          mailWarning = mailErr?.message || 'Error inesperado al enviar la notificación por correo.'
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        new_status_name:  targetName,
        new_status_color: (targetState as any).color,
      },
      warning: mailWarning,
    })

  } catch (err) {
    console.error('[POST update-status] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
