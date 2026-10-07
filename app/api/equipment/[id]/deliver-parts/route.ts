// app/api/equipment/[id]/deliver-parts/route.ts
// Endpoint dedicado para que Logística (almacen, admin, superadmin) registre
// entregas de repuestos de forma independiente al estado del servicio.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api/auth'
import { mailer } from '@/lib/mail/mailer'
import type { ApprovedPartItem, PartsDelivery, DeliveryLineItem, PartsStatus } from '@/types/equipment'

// Roles autorizados para registrar entregas de repuestos
const ALLOWED_ROLES = ['almacen', 'admin', 'superadmin'] as const

// Schema de validación del body
const deliverPartsSchema = z.object({
  items: z
    .array(
      z.object({
        descripcion: z.string().min(1, 'La descripción es obligatoria'),
        cantidad:    z.number().int().positive('La cantidad debe ser mayor a 0'),
        nota:        z.string().optional().default(''),
      })
    )
    .min(1, 'Debe incluir al menos un ítem de entrega'),
  observaciones: z.string().optional().default(''),
})

/** Recalcula parts_status basándose en los ítems actualizados de approved_parts */
function calcPartsStatus(parts: ApprovedPartItem[]): PartsStatus {
  if (!parts || parts.length === 0) return 'SIN_REPUESTOS'
  const totalSolicitado = parts.reduce((acc, p) => acc + p.cantidad_solicitada, 0)
  const totalEntregado  = parts.reduce((acc, p) => acc + p.cantidad_entregada, 0)
  if (totalEntregado === 0)               return 'SIN_REPUESTOS'
  if (totalEntregado >= totalSolicitado)  return 'COMPLETO'
  return 'PARCIAL'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params

    // 1. Autenticación y autorización de rol
    const authResult = await requireAuth('username, role, is_active')
    if (!authResult.ok) return authResult.error
    const { supabase, profile } = authResult.ctx

    if (!ALLOWED_ROLES.includes(profile.role as any)) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para registrar entregas de repuestos' },
        { status: 403 }
      )
    }

    // 2. Validar body
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Body inválido' }, { status: 400 })
    }

    const parsed = deliverPartsSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { items, observaciones } = parsed.data

    // 3. Obtener el equipo con sus datos de repuestos y hilo de correo
    const { data: equipment, error: eqError } = await supabase
      .from('equipment_records')
      .select(
        'id, fr_number, client_name, brand, model, serial_number, ' +
        'approved_parts, parts_deliveries, parts_status, ' +
        'email_thread_id, email_thread_subject'
      )
      .eq('id', equipmentId)
      .single()

    if (eqError || !equipment) {
      if (eqError?.code === 'PGRST116' || !equipment) {
        return NextResponse.json({ success: false, error: 'Equipo no encontrado' }, { status: 404 })
      }
      console.error('[POST deliver-parts] Error fetching equipment:', eqError)
      return NextResponse.json(
        { success: false, error: 'Error al consultar el equipo' },
        { status: 500 }
      )
    }

    const eq = equipment as any

    // 4. Construir la entrada de entrega
    const deliveryId  = crypto.randomUUID()
    const deliveryNow = new Date().toISOString()

    const newDelivery: PartsDelivery = {
      id:            deliveryId,
      fecha:         deliveryNow,
      entregado_por: profile.username,
      items:         items as DeliveryLineItem[],
      observaciones: observaciones || undefined,
    }

    // 5. Actualizar cantidades entregadas en approved_parts
    const currentApprovedParts: ApprovedPartItem[] = Array.isArray(eq.approved_parts)
      ? eq.approved_parts
      : []

    // Intentamos hacer match por descripción (case-insensitive). Si no hay match
    // o si approved_parts está vacío, guardamos la entrega igual.
    const updatedApprovedParts: ApprovedPartItem[] = currentApprovedParts.map((part) => {
      const match = items.find(
        (item) => item.descripcion.trim().toLowerCase() === part.descripcion.trim().toLowerCase()
      )
      if (!match) return part
      return {
        ...part,
        cantidad_entregada: part.cantidad_entregada + match.cantidad,
      }
    })

    // 6. Agregar la entrega al historial de entregas
    const currentDeliveries: PartsDelivery[] = Array.isArray(eq.parts_deliveries)
      ? eq.parts_deliveries
      : []
    const updatedDeliveries = [...currentDeliveries, newDelivery]

    // 7. Calcular nuevo parts_status
    const newPartsStatus = calcPartsStatus(updatedApprovedParts)

    // 8. Persistir en BD
    const { error: updateError } = await (supabase.from('equipment_records') as any)
      .update({
        approved_parts:   updatedApprovedParts,
        parts_deliveries: updatedDeliveries,
        parts_status:     newPartsStatus,
      })
      .eq('id', equipmentId)

    if (updateError) {
      console.error('[POST deliver-parts] DB update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al guardar la entrega de repuestos' },
        { status: 500 }
      )
    }

    // 9. Registrar en status_history con nota descriptiva (sin cambiar current_status_id)
    const partsLabel = newPartsStatus === 'COMPLETO' ? 'COMPLETO' : newPartsStatus === 'PARCIAL' ? 'PARCIAL' : 'SIN_REPUESTOS'
    const notaHistorial =
      `📦 Entrega de repuestos (${partsLabel}): ` +
      items.map((i) => `${i.cantidad}x ${i.descripcion}`).join(', ') +
      (observaciones ? ` — ${observaciones}` : '')

    // Obtener estado actual para el historial
    const { data: currentStatusData } = await supabase
      .from('equipment_records')
      .select('current_status_id')
      .eq('id', equipmentId)
      .single()

    const { data: currentState } = currentStatusData
      ? await supabase
          .from('workflow_states')
          .select('name')
          .eq('id', (currentStatusData as any).current_status_id)
          .single()
      : { data: null }

    const statusName = (currentState as any)?.name ?? 'Desconocido'

    await (supabase.from('status_history') as any).insert({
      equipment_id:        equipmentId,
      new_status:          statusName,      // mismo estado, sin cambio de servicio
      previous_status:     statusName,
      changed_by_username: profile.username,
      changed_by_role:     profile.role,
      notes:               notaHistorial,
      is_override:         false,
    })

    // 10. Enviar correo de entrega logística en el hilo compartido
    let mailWarning: string | null = null

    if (!eq.email_thread_id) {
      mailWarning = 'El equipo no tiene hilo de correo registrado. La notificación no fue enviada.'
    } else {
      try {
        const mailResult = await mailer.sendEntregaLogistica({
          fr_number:      eq.fr_number,
          client_name:    eq.client_name,
          brand:          eq.brand,
          model:          eq.model,
          serial_number:  eq.serial_number,
          thread_id:      eq.email_thread_id,
          thread_subject: eq.email_thread_subject ?? null,
          items:          items.map((i) => ({
            descripcion: i.descripcion,
            cantidad:    String(i.cantidad),
            nota:        i.nota ?? '',
          })),
          observaciones:  observaciones,
        })

        if (!mailResult.success && !mailResult.skipped) {
          mailWarning = mailResult.error || 'Error al enviar la notificación por correo.'
        }
      } catch (mailErr: any) {
        console.error('[POST deliver-parts] Error sending email:', mailErr)
        mailWarning = mailErr?.message || 'Error inesperado al enviar el correo.'
      }
    }

    return NextResponse.json({
      success:      true,
      parts_status: newPartsStatus,
      warning:      mailWarning,
      data: {
        delivery_id:     deliveryId,
        parts_status:    newPartsStatus,
        approved_parts:  updatedApprovedParts,
        parts_deliveries: updatedDeliveries,
      },
    })
  } catch (err) {
    console.error('[POST deliver-parts] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
