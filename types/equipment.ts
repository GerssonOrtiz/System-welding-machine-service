// types/equipment.ts
// Tipos TypeScript para equipos — derivados del esquema de ESQUEMA_BASE_DATOS.md
// Convención: PascalCase para tipos, inglés para nombres de tipos/campos

import type { Database } from '@/types/database.types'

// ─────────────────────────────────────────
// Tipos base desde la BD
// ─────────────────────────────────────────

/** Fila de equipment_records tal como viene de la BD */
export type EquipmentRecord = Database['public']['Tables']['equipment_records']['Row']

/** Input para crear un equipo nuevo */
export type EquipmentInsert = Database['public']['Tables']['equipment_records']['Insert']

/** Input para actualizar un equipo existente */
export type EquipmentUpdate = Database['public']['Tables']['equipment_records']['Update']

/** Fila de la vista equipment_with_status (JOIN con workflow_states y user_profiles) */
export type EquipmentWithStatus = Database['public']['Views']['equipment_with_status']['Row']

// ─────────────────────────────────────────
// Enum de tipo de servicio
// ─────────────────────────────────────────

export type ServiceType = Database['public']['Enums']['service_type_enum']

/** Mapeo legible del enum para mostrar en la UI */
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  GARANTIA_CABELAB: 'Garantía CABELAB',
  GARANTIA_ESAB:    'Garantía ESAB',
  REVISION_GENERAL: 'Revisión General',
}

// ─────────────────────────────────────────
// Estado del workflow
// ─────────────────────────────────────────

export type WorkflowState = Database['public']['Tables']['workflow_states']['Row']
export type WorkflowTransition = Database['public']['Tables']['workflow_transitions']['Row']

/** Transición con nombres de estados incluidos (para el editor de workflow) */
export interface WorkflowTransitionWithNames extends WorkflowTransition {
  from_state_name: string
  to_state_name:   string
}

// ─────────────────────────────────────────
// Historial de estado
// ─────────────────────────────────────────

export type StatusHistoryEntry = Database['public']['Tables']['status_history']['Row']

// ─────────────────────────────────────────
// Sistema de repuestos desacoplado
// ─────────────────────────────────────────

/** Estado logístico de repuestos — completamente independiente del estado del servicio */
export type PartsStatus = 'SIN_REPUESTOS' | 'PARCIAL' | 'COMPLETO'

/** Ítem de repuesto aprobado por Ventas al pasar a estado "Aprobado" */
export interface ApprovedPartItem {
  id:                  string  // UUID generado al inicializar
  descripcion:         string
  cantidad_solicitada: number
  cantidad_entregada:  number
  precio:              string
}

/** Un ítem individual dentro de una entrega de Logística */
export interface DeliveryLineItem {
  descripcion: string
  cantidad:    number
  nota?:       string
}

/** Registro de una entrega de repuestos realizada por Logística */
export interface PartsDelivery {
  id:            string  // UUID de la entrega
  fecha:         string  // ISO 8601
  entregado_por: string  // username del usuario que registró
  items:         DeliveryLineItem[]
  observaciones?: string
}

/** Body del request POST /api/equipment/[id]/deliver-parts */
export interface DeliverPartsInput {
  items:          DeliveryLineItem[]
  observaciones?: string
}

/** Labels legibles para el badge de partsStatus en la UI */
export const PARTS_STATUS_LABELS: Record<PartsStatus, string> = {
  SIN_REPUESTOS: 'Sin repuestos',
  PARCIAL:       'Repuestos parciales',
  COMPLETO:      'Repuestos completos',
}

/** Clases Tailwind para el badge de partsStatus */
export const PARTS_STATUS_COLORS: Record<PartsStatus, { bg: string; text: string; border: string }> = {
  SIN_REPUESTOS: { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30' },
  PARCIAL:       { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  border: 'border-yellow-500/30' },
  COMPLETO:      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
}

// ─────────────────────────────────────────
// Tipos de respuesta de la API
// ─────────────────────────────────────────

/** Respuesta de GET /api/equipment */
export interface EquipmentListResponse {
  equipments:  EquipmentWithStatus[]
  total:       number
  page:        number
  page_size:   number
  total_pages: number
}

/** Respuesta de GET /api/equipment/[id]/details */
export interface EquipmentDetailResponse {
  equipment:   EquipmentWithStatus
  history:     StatusHistoryEntry[]
  next_states: Pick<WorkflowState, 'id' | 'name' | 'color'>[]
  can_advance: boolean
}

/** Respuesta de GET /api/equipment/search */
export interface EquipmentSearchResponse {
  results: EquipmentWithStatus[]
  total:   number
}

// ─────────────────────────────────────────
// Helpers de negocio
// ─────────────────────────────────────────

/** Un equipo se considera atrasado si lleva más de 5 días sin llegar a Entregado */
export const OVERDUE_THRESHOLD_DAYS = 5

/** Determina si un equipo está atrasado */
export function isEquipmentOverdue(equipment: EquipmentWithStatus): boolean {
  const daysElapsed = equipment.days_elapsed ?? 0
  const isTerminal = equipment.is_terminal ?? false
  return !isTerminal && daysElapsed > OVERDUE_THRESHOLD_DAYS
}

/** Roles que pueden ver TODOS los equipos (sin filtro por estado) */
export const ROLES_WITH_FULL_VIEW = ['superadmin', 'admin', 'visualizador'] as const

/** Estados relevantes por rol (para filtrado en GET /api/equipment) */
export const ROLE_RELEVANT_STATES: Record<string, string[]> = {
  operaciones: [
    'En espera de diagnóstico',
    'En diagnóstico',
    'Aprobado',
    'En mantenimiento',
    // Compatibilidad con equipos en estados legacy de repuestos
    'En espera de repuesto',
    'En espera de repuesto adicional',
  ],
  recepcion: [
    'En espera de diagnóstico',
    'Pendiente de aprobación',
    'Aprobado',
    'Entregado',
  ],
  almacen: [
    // Almacén ve equipos aprobados/en mantenimiento para registrar entregas de repuestos
    'Aprobado',
    'En mantenimiento',
    'En espera de repuesto',
    'En espera de repuesto adicional',
  ],
}
