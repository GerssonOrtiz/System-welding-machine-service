import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { mailer } from '@/lib/mail/mailer'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params
    const authResult = await requireAuth()
    if (!authResult.ok) return authResult.error
    const { supabase, profile } = authResult.ctx

    const isSuperadmin = profile.role === 'superadmin' && profile.is_superadmin
    const isAdmin = profile.role === 'admin'
    const isRecepcion = profile.role === 'recepcion'

    // 1. Obtener el equipo actual con su estado
    const { data: currentEquipment, error: fetchError } = await (supabase
      .from('equipment_records') as any)
      .select(`
        *,
        workflow_states:current_status_id (
          id,
          name,
          is_initial
        )
      `)
      .eq('id', equipmentId)
      .single()

    if (fetchError || !currentEquipment) {
      return NextResponse.json({ success: false, error: 'Equipo no encontrado' }, { status: 404 })
    }

    const isInitialState = currentEquipment.workflow_states?.is_initial === true ||
      currentEquipment.workflow_states?.name === 'En espera de diagnóstico'

    // 2. Verificar permisos:
    // Superadmin y admin pueden editar siempre.
    // Recepción solo puede editar si el equipo está en estado inicial ("En espera de diagnóstico").
    if (!isSuperadmin && !isAdmin) {
      if (!isRecepcion) {
        return NextResponse.json(
          { success: false, error: 'No tienes permisos para modificar este equipo' },
          { status: 403 }
        )
      }
      if (!isInitialState) {
        return NextResponse.json(
          {
            success: false,
            error: 'Recepción solo puede modificar equipos que se encuentren en estado "En espera de diagnóstico"',
          },
          { status: 403 }
        )
      }
    }

    // 3. Leer cuerpo
    const body = await request.json()

    // Normalizar a mayúsculas como en la creación
    const updateData: any = {}
    if (body.fr_number !== undefined) updateData.fr_number = body.fr_number.trim().toUpperCase()
    if (body.client_name !== undefined) updateData.client_name = body.client_name.trim().toUpperCase()
    if (body.brand !== undefined) updateData.brand = body.brand.trim() ? body.brand.trim().toUpperCase() : 'S/M'
    if (body.model !== undefined) updateData.model = body.model.trim() ? body.model.trim().toUpperCase() : 'S/M'
    if (body.serial_number !== undefined) updateData.serial_number = body.serial_number.trim() ? body.serial_number.trim().toUpperCase() : 'N/S'
    
    // Solo admin y superadmin pueden asignar o modificar N° de informe y URL del PDF
    if (!isRecepcion) {
      if (body.report_number !== undefined) updateData.report_number = body.report_number.trim().toUpperCase() || null
      if (body.report_url !== undefined) updateData.report_url = body.report_url?.trim() || null
    }
    if (body.client_report !== undefined) updateData.client_report = body.client_report.trim().toUpperCase() || null
    if (body.accessories !== undefined) updateData.accessories = body.accessories.trim().toUpperCase() || null
    if (body.condition_in !== undefined) updateData.condition_in = body.condition_in.trim().toUpperCase() || null
    if (body.additional_observations !== undefined) updateData.additional_observations = body.additional_observations.trim().toUpperCase() || null
    
    if (body.service_type !== undefined) updateData.service_type = body.service_type
    if (body.date_in !== undefined) updateData.date_in = body.date_in
    if (body.priority_level !== undefined) {
      updateData.priority_level = body.priority_level
      updateData.is_priority = body.priority_level > 0
    } else if (body.is_priority !== undefined) {
      updateData.is_priority = body.is_priority
    }

    // Timestamps operativos (solo superadmin puede enviarlos)
    if (isSuperadmin) {
      if (body.start_diagnosis_at !== undefined) updateData.start_diagnosis_at = body.start_diagnosis_at
      if (body.end_diagnosis_at !== undefined) updateData.end_diagnosis_at = body.end_diagnosis_at
      if (body.pending_approval_at !== undefined) updateData.pending_approval_at = body.pending_approval_at
      if (body.approval_at !== undefined) updateData.approval_at = body.approval_at
      if (body.start_maintenance_at !== undefined) updateData.start_maintenance_at = body.start_maintenance_at
      if (body.end_maintenance_at !== undefined) updateData.end_maintenance_at = body.end_maintenance_at
      if (body.finalized_at !== undefined) updateData.finalized_at = body.finalized_at
    }

    // 4. Validaciones mínimas
    if (updateData.client_name === '') return NextResponse.json({ success: false, error: 'El cliente no puede estar vacío' }, { status: 400 })
    if (updateData.fr_number === '') return NextResponse.json({ success: false, error: 'El número de FR no puede estar vacío' }, { status: 400 })

    // 5. Verificar si el nuevo FR ya existe en otro equipo
    if (updateData.fr_number) {
      const { data: existingFR } = await (supabase
        .from('equipment_records') as any)
        .select('id')
        .eq('fr_number', updateData.fr_number)
        .neq('id', equipmentId)
        .maybeSingle()

      if (existingFR) {
        return NextResponse.json(
          { success: false, error: `Ya existe otro equipo registrado con la Ficha de Recepción ${updateData.fr_number}` },
          { status: 409 }
        )
      }
    }

    // 6. Auto-registrar marca y modelo en catálogo si cambiaron y no son S/M
    const finalBrand = updateData.brand ?? currentEquipment.brand
    const finalModel = updateData.model ?? currentEquipment.model
    if (finalBrand && finalBrand !== 'S/M') {
      try {
        let brand_id: string | null = null
        const { data: existingBrand } = await supabase
          .from('catalog_brands')
          .select('id')
          .eq('name', finalBrand)
          .maybeSingle()

        if (!existingBrand) {
          const { data: newBrand } = await supabase
            .from('catalog_brands')
            .insert({ name: finalBrand })
            .select('id')
            .single()
          brand_id = newBrand?.id ?? null
        } else {
          brand_id = existingBrand.id
        }

        if (brand_id && finalModel && finalModel !== 'S/M') {
          const { data: existingModel } = await supabase
            .from('catalog_models')
            .select('id')
            .eq('brand_id', brand_id)
            .eq('name', finalModel)
            .maybeSingle()

          if (!existingModel) {
            await supabase.from('catalog_models').insert({
              brand_id,
              name: finalModel,
            })
          }
        }
      } catch (catErr) {
        console.error('[PUT /api/equipment/[id]/update] Error auto-registering brand/model:', catErr)
      }
    }

    // 7. Actualizar equipo
    const { error: updateError } = await (supabase
      .from('equipment_records') as any)
      .update(updateData)
      .eq('id', equipmentId)

    if (updateError) {
      console.error('[PUT /api/equipment/[id]/update] Update error:', updateError)
      return NextResponse.json({ success: false, error: 'Error al actualizar el equipo en la base de datos: ' + updateError.message }, { status: 500 })
    }

    // 8. Reenvío de correo de rectificación si fue solicitado (A+B):
    //    - Si el equipo tiene hilo existente → reply en el hilo con tabla completa del lote
    //    - Si no tiene hilo → correo nuevo (comportamiento legacy)
    let emailSent = false
    let mailWarning: string | null = null

    if (body.resend_email === true) {
      try {
        // Datos del equipo editado con los valores ya actualizados
        const correctedFR = updateData.fr_number ?? currentEquipment.fr_number
        const correctedEquipment = {
          fr_number: correctedFR,
          brand: updateData.brand ?? currentEquipment.brand,
          model: updateData.model ?? currentEquipment.model,
          serial_number: updateData.serial_number ?? currentEquipment.serial_number,
          service_type: updateData.service_type ?? currentEquipment.service_type,
          client_report: updateData.client_report ?? currentEquipment.client_report ?? 'SIN REPORTE',
          accessories: updateData.accessories ?? currentEquipment.accessories ?? 'NINGUNO',
          is_priority: updateData.is_priority ?? currentEquipment.is_priority ?? false,
          date_in: updateData.date_in ?? currentEquipment.date_in,
        }
        const clientName = updateData.client_name ?? currentEquipment.client_name
        const existingThreadId: string | null = currentEquipment.email_thread_id ?? null
        const existingThreadSubject: string | null = currentEquipment.email_thread_subject ?? null

        if (existingThreadId) {
          // ─── A+B: reply en el hilo con tabla completa del lote ───────────
          // Traer los demás equipos del mismo lote (si existe batch_id)
          let batchEquipments = [correctedEquipment]
          if (currentEquipment.batch_id) {
            const { data: siblings } = await (supabase.from('equipment_records') as any)
              .select('fr_number, brand, model, serial_number, service_type, client_report, accessories, is_priority, date_in')
              .eq('batch_id', currentEquipment.batch_id)
              .neq('id', equipmentId)

            if (siblings && siblings.length > 0) {
              batchEquipments = [correctedEquipment, ...siblings]
            }
          }

          // Ordenar por FR para que la tabla tenga el mismo orden que el correo original
          batchEquipments.sort((a, b) =>
            (a.fr_number ?? '').localeCompare(b.fr_number ?? '', 'es', { numeric: true })
          )

          const mailResult = await mailer.sendRectificacionIngreso({
            thread_id: existingThreadId,
            thread_subject: existingThreadSubject,
            client_name: clientName,
            equipments: batchEquipments,
            corrected_fr: correctedFR,
          })

          if (mailResult.success) {
            emailSent = true
            // NO actualizamos email_thread_id — el hilo existente se preserva intacto
          } else if (mailResult.skipped) {
            mailWarning = 'Equipo actualizado, pero el correo no se envió porque RESEND_API_KEY no está configurada.'
          } else if (mailResult.error) {
            mailWarning = `Equipo actualizado, pero ocurrió un problema al enviar la rectificación: ${mailResult.error}`
          }
        } else {
          // ─── Sin hilo previo: correo nuevo (solo este equipo) ─────────────
          const mailResult = await mailer.sendBatchEquipmentEntry({
            client_name: clientName,
            equipments: [correctedEquipment],
          })

          if (mailResult.success) {
            emailSent = true
            if (mailResult.messageId) {
              const updatePayload: Record<string, any> = { email_thread_id: mailResult.messageId }
              if (mailResult.subject) updatePayload.email_thread_subject = mailResult.subject
              await (supabase.from('equipment_records') as any)
                .update(updatePayload)
                .eq('id', equipmentId)
            }
          } else if (mailResult.skipped) {
            mailWarning = 'Equipo actualizado, pero el correo no se envió porque RESEND_API_KEY no está configurada.'
          } else if (mailResult.error) {
            mailWarning = `Equipo actualizado, pero ocurrió un problema al reenviar el correo: ${mailResult.error}`
          }
        }
      } catch (mailErr: any) {
        console.error('[PUT /api/equipment/[id]/update] Error sending rectification email:', mailErr)
        mailWarning = `Equipo actualizado, pero no se pudo enviar el correo: ${mailErr?.message || 'Error desconocido'}`
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      warning: mailWarning,
    })

  } catch (err: any) {
    console.error('[PUT /api/equipment/[id]/update] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor: ' + (err?.message || '') }, { status: 500 })
  }
}
