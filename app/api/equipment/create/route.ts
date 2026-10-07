import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import { canCreateEquipment } from '@/types/user'
import { createEquipmentSchema, createBatchEquipmentSchema } from '@/lib/validations/equipment.schema'
import { mailer, type EquipmentItemData } from '@/lib/mail/mailer'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const authResult = await requireAuth('role, is_active')
    if (!authResult.ok) return authResult.error
    const { supabase, userId, profile } = authResult.ctx

    // 2. Verificar permisos
    if (!canCreateEquipment(profile.role as any)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No cuentas con permisos para crear equipos',
        },
        { status: 403 }
      )
    }

    // 3. Leer Body
    const body = await request.json()

    // 4. Determinar si es lote (array 'equipments') o individual
    let clientNameRaw: string = ''
    let equipmentsList: Array<any> = []

    if (Array.isArray(body?.equipments)) {
      const parsedBatch = createBatchEquipmentSchema.safeParse(body)
      if (!parsedBatch.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Datos de lote de equipos inválidos',
            details: parsedBatch.error.flatten(),
          },
          { status: 400 }
        )
      }
      clientNameRaw = parsedBatch.data.client_name
      equipmentsList = parsedBatch.data.equipments
    } else {
      const parsedSingle = createEquipmentSchema.safeParse(body)
      if (!parsedSingle.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Datos de equipo inválidos',
            details: parsedSingle.error.flatten(),
          },
          { status: 400 }
        )
      }
      clientNameRaw = parsedSingle.data.client_name
      const { client_name: _, ...eqData } = parsedSingle.data
      equipmentsList = [eqData]
    }

    const client_name = clientNameRaw.trim().toUpperCase()

    // 5. Normalizar equipos
    const normalizedEquipments = equipmentsList.map(eq => ({
      fr_number: eq.fr_number.trim().toUpperCase(),
      service_type: eq.service_type,
      brand: eq.brand?.trim() ? eq.brand.trim().toUpperCase() : 'S/M',
      model: eq.model?.trim() ? eq.model.trim().toUpperCase() : 'S/M',
      serial_number: eq.serial_number?.trim() ? eq.serial_number.trim().toUpperCase() : 'N/S',
      client_report: eq.client_report?.trim().toUpperCase() || null,
      accessories: eq.accessories?.trim().toUpperCase() || null,
      condition_in: eq.condition_in?.trim().toUpperCase() || null,
      additional_observations: eq.additional_observations?.trim().toUpperCase() || null,
      priority_level: eq.priority_level || 0,
      is_priority: (eq.priority_level || 0) > 0,
      report_url: eq.report_url?.trim() || null,
    }))

    // 6. Verificar duplicados dentro del mismo payload
    const frSet = new Set<string>()
    for (const eq of normalizedEquipments) {
      if (frSet.has(eq.fr_number)) {
        return NextResponse.json(
          {
            success: false,
            error: `El número de FR ${eq.fr_number} está duplicado en la misma solicitud.`,
          },
          { status: 400 }
        )
      }
      frSet.add(eq.fr_number)
    }

    // 7. Verificar FRs existentes en la base de datos
    const frList = Array.from(frSet)
    const { data: existingFRs, error: existingFRError } = await supabase
      .from('equipment_records')
      .select('fr_number')
      .in('fr_number', frList)

    if (existingFRError) {
      console.error('[POST /api/equipment/create] Error checking FRs:', existingFRError)
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo verificar si los números de FR ya existen en el sistema',
        },
        { status: 500 }
      )
    }

    if (existingFRs && existingFRs.length > 0) {
      const dupes = existingFRs.map(e => e.fr_number).join(', ')
      return NextResponse.json(
        {
          success: false,
          error: `Ya existe(n) equipo(s) registrado(s) con la(s) Ficha(s) de Recepción: ${dupes}`,
        },
        { status: 409 }
      )
    }

    // 8. Obtener estado inicial del workflow
    const { data: initialState, error: stateError } = await supabase
      .from('workflow_states')
      .select('id')
      .eq('is_initial', true)
      .single()

    if (stateError || !initialState) {
      console.error('[POST /api/equipment/create] Initial workflow state not found:', stateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Error de configuración del sistema: No se encontró un estado de workflow inicial',
        },
        { status: 500 }
      )
    }

    // 9. Registrar marcas y modelos nuevos en el catálogo
    for (const eq of normalizedEquipments) {
      if (eq.brand !== 'S/M') {
        try {
          let brand_id: string | null = null
          const { data: existingBrand } = await supabase
            .from('catalog_brands')
            .select('id')
            .eq('name', eq.brand)
            .maybeSingle()

          if (!existingBrand) {
            const { data: newBrand } = await supabase
              .from('catalog_brands')
              .insert({ name: eq.brand })
              .select('id')
              .single()
            brand_id = newBrand?.id ?? null
          } else {
            brand_id = existingBrand.id
          }

          if (brand_id && eq.model !== 'S/M') {
            const { data: existingModel } = await supabase
              .from('catalog_models')
              .select('id')
              .eq('brand_id', brand_id)
              .eq('name', eq.model)
              .maybeSingle()

            if (!existingModel) {
              await supabase.from('catalog_models').insert({
                brand_id,
                name: eq.model,
              })
            }
          }
        } catch (catErr) {
          console.error('[POST /api/equipment/create] Error auto-registering brand/model:', catErr)
        }
      }
    }

    // 10. Generar batch_id para agrupar los equipos si son 2 o más
    const batchId = normalizedEquipments.length > 1 ? randomUUID() : null

    // 11. Insertar registros en equipment_records
    const recordsToInsert = normalizedEquipments.map(eq => ({
      fr_number: eq.fr_number,
      client_name,
      service_type: eq.service_type,
      brand: eq.brand,
      model: eq.model,
      serial_number: eq.serial_number,
      client_report: eq.client_report,
      accessories: eq.accessories,
      condition_in: eq.condition_in,
      additional_observations: eq.additional_observations,
      current_status_id: initialState.id,
      created_by: userId,
      priority_level: eq.priority_level,
      is_priority: eq.is_priority,
      report_url: eq.report_url,
      batch_id: batchId,
    }))

    const { data: insertedRecords, error: insertError } = await (supabase.from('equipment_records') as any)
      .insert(recordsToInsert)
      .select('id, fr_number')

    if (insertError || !insertedRecords || insertedRecords.length === 0) {
      console.error('[POST /api/equipment/create] Error inserting equipment records:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: 'Ocurrió un error al registrar los equipos en la base de datos',
        },
        { status: 500 }
      )
    }

    const insertedIds = insertedRecords.map((r: any) => r.id)

    // 12. Despachar UN SOLO CORREO con todos los equipos en la misma tabla
    let mailWarning: string | null = null

    try {
      const mailEquipments: EquipmentItemData[] = normalizedEquipments.map(eq => ({
        fr_number: eq.fr_number,
        brand: eq.brand,
        model: eq.model,
        serial_number: eq.serial_number,
        service_type: eq.service_type,
        client_report: eq.client_report || 'SIN REPORTE',
        accessories: eq.accessories || 'NINGUNO',
        is_priority: eq.is_priority,
      }))

      const mailResult = await mailer.sendBatchEquipmentEntry({
        client_name,
        equipments: mailEquipments,
      })

      // 13. Guardar email_thread_id y email_thread_subject en TODOS los equipos insertados
      if (mailResult.success && mailResult.messageId) {
        const updatePayload: Record<string, any> = {
          email_thread_id: mailResult.messageId,
        }
        if (mailResult.subject) {
          updatePayload.email_thread_subject = mailResult.subject
        }

        const { error: threadError } = await (supabase.from('equipment_records') as any)
          .update(updatePayload)
          .in('id', insertedIds)

        if (threadError) {
          console.error('[POST /api/equipment/create] Error saving thread ID/subject:', threadError)
          mailWarning = 'Los equipos fueron registrados, pero no se pudo asociar el identificador del correo de notificación.'
        }
      } else if (!mailResult.success && !mailResult.skipped) {
        mailWarning = mailResult.error || 'No se pudo enviar el correo de ingreso.'
      }
    } catch (mailErr) {
      console.error('[POST /api/equipment/create] Mailer error:', mailErr)
      mailWarning = 'Los equipos fueron registrados, pero ocurrió un error al enviar el correo de notificación.'
    }

    // 14. Respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        id: insertedIds[0],
        ids: insertedIds,
        total: insertedIds.length,
        batch_id: batchId,
      },
      warning: mailWarning,
    })
  } catch (err) {
    console.error('[POST /api/equipment/create] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}