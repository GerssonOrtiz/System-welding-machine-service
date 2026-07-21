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
})

export type CreateEquipmentInput = {
  fr_number: string
  client_name: string
  service_type: 'GARANTIA_CABELAB' | 'GARANTIA_ESAB' | 'REVISION_GENERAL'
  brand?: string | null
  model?: string | null
  serial_number?: string | null
  client_report?: string | null
  accessories?: string | null
  condition_in?: string | null
  additional_observations?: string | null
  priority_level?: number
}
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>
export type ForceStatusInput = z.infer<typeof forceStatusSchema>
