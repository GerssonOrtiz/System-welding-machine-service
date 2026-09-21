// lib/validations/equipment.schema.ts
import { z } from 'zod'

export const createEquipmentSchema = z.object({
  fr_number: z.string()
    .min(1, { message: 'El número de FR es obligatorio' })
    .max(50, { message: 'El FR no puede exceder los 50 caracteres' }),
  client_name: z.string().min(2, { message: 'El nombre del cliente es obligatorio' }),
  service_type: z.enum(['GARANTIA_CABELAB', 'GARANTIA_ESAB', 'REVISION_GENERAL']),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serial_number: z.string().optional().nullable(),
  client_report: z.string().optional().nullable(),
  accessories: z.string().optional().nullable(),
  condition_in: z.string().optional().nullable(),
  additional_observations: z.string().optional().nullable(),
  priority_level: z.number().int().min(0).max(3).default(0),
  /** Correos adicionales en copia seleccionados al ingresar el equipo */
  cc_extra: z.array(z.string().email()).optional().default([]),
})

export const updateStatusSchema = z.object({
  new_status_id: z.number().int({ message: 'ID de estado inválido' }),
  assigned_technician_ids: z.array(z.number()).optional(),
  notes: z.string().optional().nullable(),
  report_number: z.string().optional().nullable(),
})

export const forceStatusSchema = z.object({
  new_status_id: z.number().int({ message: 'ID de estado inválido' }),
  override_reason: z.string().min(5, { message: 'El motivo del override debe tener al menos 5 caracteres' }),
  /** Si es true, se enviará una notificación interna por correo del cambio forzado */
  notify_by_email: z.boolean().default(false),
  /** Correos adicionales en copia seleccionados para notificar el cambio forzado */
  cc_extra: z.array(z.string().email()).optional().default([]),
})

// ─── Schemas para los payloads de correo por evento ───────────────────────────

export const informeODPSchema = z.object({
  new_status_id: z.number().int(),
  assigned_technician_ids: z.array(z.number()).optional(),
  notes: z.string().optional().nullable(),
  // Campos del correo
  diagnostico: z.string().min(1, { message: 'El diagnóstico es obligatorio' }),
  // pdf_buffer se procesa aparte desde FormData, no va en este schema
})

export const aprobacionVentasSchema = z.object({
  new_status_id: z.number().int(),
  notes: z.string().optional().nullable(),
  // Campos del correo
  items: z.array(z.object({
    descripcion: z.string().min(1),
    cantidad: z.string().min(1),
    precio: z.string().min(1),
  })).min(1, { message: 'Debe agregar al menos un ítem' }),
  observaciones: z.string().optional().default(''),
})

export const entregaLogisticaSchema = z.object({
  new_status_id: z.number().int(),
  notes: z.string().optional().nullable(),
  // Campos del correo
  items: z.array(z.object({
    descripcion: z.string().min(1),
    cantidad: z.string().min(1),
    nota: z.string().optional().default(''),
  })).min(1, { message: 'Debe agregar al menos un repuesto' }),
  observaciones: z.string().optional().default(''),
})

export const culminadoODPSchema = z.object({
  new_status_id: z.number().int(),
  notes: z.string().optional().nullable(),
  // Campos del correo
  observaciones: z.string().optional().default(''),
})

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>
export type ForceStatusInput = z.infer<typeof forceStatusSchema>
export type InformeODPInput = z.infer<typeof informeODPSchema>
export type AprobacionVentasInput = z.infer<typeof aprobacionVentasSchema>
export type EntregaLogisticaInput = z.infer<typeof entregaLogisticaSchema>
export type CulminadoODPInput = z.infer<typeof culminadoODPSchema>