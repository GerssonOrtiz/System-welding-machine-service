// app/api/equipment/[id]/return-parts/route.ts
// Endpoint para que Operaciones (operaciones, admin, superadmin) registre
// devoluciones o rebotes de repuestos hacia Almacén.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api/auth'
import { mailer } from '@/lib/mail/mailer'
import type {
  ApprovedPartItem,
  PartsStatus,
  ReturnLineItem,
  PartsReturn,
  PartReturnReason
} from '@/types/equipment'
import { PART_RETURN_REASON_LABELS } from '@/types/equipment'

// Roles autorizados para registrar devoluciones de repuestos
const ALLOWED_ROLES = ['operaciones', 'admin', 'superadmin'] as const

// Schema de validación del body
const returnPartsSchema = z.object({
  items: z
    .array(
      z.object({
        descripcion:       z.string().min(1, 'La descripción es obligatoria'),
        cantidad_devuelta: z.number().int().positive('La cantidad a devolver debe ser mayor a 0'),
        motivo:            z.enum(['INCOMPATIBLE', 'DEFECTUOSO', 'NO_REQUERIDO', 'DESPACHO_ERRONEO', 'OTRO']),
        detalle:           z.string().optional().default(''),
      })
    )
    .min(1, 'Debe incluir al menos un ítem a devolver'),
  observaciones: z.string().optional().default(''),
})

/** Recalcula parts_status basándose en los ítems de repuestos (excluyendo servicios) */
function calcPartsStatus(parts: ApprovedPartItem[]): PartsStatus {
  const physicalParts = (parts || []).filter((p) => p.tipo !== 'SERVICIO')
  if (physicalParts.length === 0) return 'SIN_REPUESTOS'
  const totalSolicitado = physicalParts.reduce((acc, p) => acc + (p.cantidad_solicitada || 0), 0)
  const totalEntregado  = physicalParts.reduce((acc, p) => acc + (p.cantidad_entregada || 0), 0)
  if (totalEntregado <= 0)              return 'SIN_REPUESTOS'
  if (totalEntregado >= totalSolicitado) return 'COMPLETO'
  return 'PARCIAL'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params

    // 1. Autenticación y rol
    const authResult = await requireAuth('username, role, is_active')
    if (!authResult.ok) return authResult.error
    const { supabase, profile } = authResult.ctx

    if (!ALLOWED_ROLES.includes(profile.role as any)) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para registrar devoluciones de repuestos' },
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

    const parsed = returnPartsSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { items, observaciones } = parsed.data

    // 3. Obtener el equipo con datos de repuestos
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
      console.error('[POST return-parts] Error fetching equipment:', eqError)
      return NextResponse.json(
        { success: false, error: 'Error al consultar el equipo' },
        { status: 500 }
      )
    }

    const eq = equipment as any
    const currentApprovedParts: ApprovedPartItem[] = Array.isArray(eq.approved_parts)
      ? eq.approved_parts
      : []

    // 4. Validar que los ítems devueltos existan y no superen lo entregado
    for (const item of items) {
      const part = currentApprovedParts.find(
        (p) => p.descripcion.trim().toLowerCase() === item.descripcion.trim().toLowerCase()
      )
      if (!part) {
        return NextResponse.json(
          {
            success: false,
            error: `El repuesto "${item.descripcion}" no figura en la lista de repuestos del equipo.`
          },
          { status: 400 }
        )
      }
      if (item.cantidad_devuelta > part.cantidad_entregada) {
        return NextResponse.json(
          {
            success: false,
            error: `No se puede devolver ${item.cantidad_devuelta} de "${item.descripcion}". Solo hay ${part.cantidad_entregada} entregado(s).`
          },
          { status: 400 }
        )
      }
    }

    // 5. Descontar las cantidades entregadas en approved_parts
    const updatedApprovedParts: ApprovedPartItem[] = currentApprovedParts.map((part) => {
      const match = items.find(
        (i) => i.descripcion.trim().toLowerCase() === part.descripcion.trim().toLowerCase()
      )
      if (!match) return part
      return {
        ...part,
        cantidad_entregada: Math.max(0, part.cantidad_entregada - match.cantidad_devuelta),
      }
    })

    // 6. Recalcular parts_status
    const newPartsStatus = calcPartsStatus(updatedApprovedParts)

    // 7. Construir registro de devolución
    const returnId = crypto.randomUUID()
    const returnNow = new Date().toISOString()
    const newReturn: PartsReturn = {
      id:           returnId,
      fecha:        returnNow,
      devuelto_por: profile.username,
      items:        items as ReturnLineItem[],
      observaciones: observaciones || undefined,
    }

    // Para no romper esquemas, guardamos la devolución en equipment_records.parts_deliveries con flag 'is_return' o similar,
    // o en una estructura compatible
    const currentDeliveries = Array.isArray(eq.parts_deliveries) ? eq.parts_deliveries : []
    const updatedDeliveries = [
      ...currentDeliveries,
      {
        ...newReturn,
        tipo: 'DEVOLUCION',
        entregado_por: profile.username, // compatibilidad
      }
    ]

    // 8. Persistir actualización en equipment_records
    const { error: updateError } = await (supabase.from('equipment_records') as any)
      .update({
        approved_parts:   updatedApprovedParts,
        parts_deliveries: updatedDeliveries,
        parts_status:     newPartsStatus,
      })
      .eq('id', equipmentId)

    if (updateError) {
      console.error('[POST return-parts] DB update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar los repuestos en la base de datos' },
        { status: 500 }
      )
    }

    // 9. Registrar en status_history (audit log)
    const itemsResumen = items
      .map((i) => {
        const labelMotivo = PART_RETURN_REASON_LABELS[i.motivo as PartReturnReason] || i.motivo
        return `${i.cantidad_devuelta}x ${i.descripcion} (${labelMotivo}${i.detalle ? `: ${i.detalle}` : ''})`
      })
      .join(', ')

    const notaHistorial =
      `↩️ Devolución de repuestos a Almacén (${newPartsStatus}): ` +
      itemsResumen +
      (observaciones ? ` — Obs: ${observaciones}` : '')

    // Obtener estado de servicio actual para mantenerlo
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
      new_status:          statusName,
      previous_status:     statusName,
      changed_by_username: profile.username,
      changed_by_role:     profile.role,
      notes:               notaHistorial,
      is_override:         false,
    })

    // 10. Enviar correo de rebote a Logística en el hilo compartido
    let mailWarning: string | null = null

    if (!eq.email_thread_id) {
      mailWarning = 'El equipo no tiene hilo de correo registrado. La notificación por correo no fue enviada.'
    } else {
      try {
        const mailResult = await mailer.sendReboteRepuestos({
          fr_number:      eq.fr_number,
          client_name:    eq.client_name,
          brand:          eq.brand,
          model:          eq.model,
          serial_number:  eq.serial_number,
          thread_id:      eq.email_thread_id,
          thread_subject: eq.email_thread_subject ?? null,
          devuelto_por:   profile.username,
          items:          items.map((i) => ({
            descripcion: i.descripcion,
            cantidad:    String(i.cantidad_devuelta),
            motivo:      PART_RETURN_REASON_LABELS[i.motivo as PartReturnReason] || i.motivo,
            detalle:     i.detalle || undefined,
          })),
          observaciones:  observaciones,
        })

        if (!mailResult.success && !mailResult.skipped) {
          mailWarning = mailResult.error || 'Error al enviar la notificación por correo a Logística.'
        }
      } catch (mailErr: any) {
        console.error('[POST return-parts] Error sending email:', mailErr)
        mailWarning = mailErr?.message || 'Error inesperado al enviar el correo.'
      }
    }

    return NextResponse.json({
      success:      true,
      parts_status: newPartsStatus,
      warning:      mailWarning,
      data: {
        return_id:        returnId,
        parts_status:     newPartsStatus,
        approved_parts:   updatedApprovedParts,
        parts_deliveries: updatedDeliveries,
      },
    })
  } catch (err) {
    console.error('[POST return-parts] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
