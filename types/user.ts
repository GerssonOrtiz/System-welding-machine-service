// types/user.ts
// Tipos TypeScript para usuarios y roles — derivados del esquema de ESQUEMA_BASE_DATOS.md

import type { Database } from '@/types/database.types'

// ─────────────────────────────────────────
// Tipos base desde la BD
// ─────────────────────────────────────────

/** Fila de user_profiles tal como viene de la BD */
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

/** Input para crear un perfil */
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']

/** Input para actualizar un perfil */
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

// ─────────────────────────────────────────
// Enum de rol
// ─────────────────────────────────────────

export type UserRole = Database['public']['Enums']['user_role_enum']

/** Todos los roles disponibles en orden jerárquico */
export const USER_ROLES: UserRole[] = [
  'superadmin',
  'admin',
  'operaciones',
  'recepcion',
  'almacen',
  'visualizador',
]

/** Roles asignables por el superadmin (no puede asignar superadmin desde la UI) */
export const ASSIGNABLE_ROLES: Exclude<UserRole, 'superadmin'>[] = [
  'admin',
  'operaciones',
  'recepcion',
  'almacen',
  'visualizador',
]

/** Etiquetas legibles para mostrar en la UI */
export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin:   'Superadmin',
  admin:        'Admin',
  operaciones:  'Operaciones',
  recepcion:    'Recepción',
  almacen:      'Almacén',
  visualizador: 'Visualizador',
}

// ─────────────────────────────────────────
// Perfil extendido con email (del panel de admin)
// ─────────────────────────────────────────

/** UserProfile con email — solo disponible para el superadmin (via auth.admin API) */
export interface UserProfileWithEmail extends UserProfile {
  email: string
}

/** Estado de aprobación de un usuario */
export type UserStatus = 'pending' | 'active' | 'blocked'

/** Retorna el estado de aprobación de un perfil */
export function getUserStatus(profile: UserProfile): UserStatus {
  if (!profile.is_active) {
    // Si nunca se ha aprobado, la fecha de creación es reciente
    // No hay campo específico — usamos is_active = false para ambos casos
    return 'blocked' // superadmin los discrimina visualmente por contexto
  }
  return 'active'
}

// ─────────────────────────────────────────
// Tipos de respuesta de la API de usuarios
// ─────────────────────────────────────────

/** Respuesta de GET /api/users/list */
export interface UserListResponse {
  users: UserProfileWithEmail[]
}

/** Usuarios agrupados por estado para la UI del superadmin */
export interface GroupedUsers {
  pending: UserProfileWithEmail[]   // is_active = false (recién registrados)
  active:  UserProfileWithEmail[]   // is_active = true
  blocked: UserProfileWithEmail[]   // is_active = false (bloqueados manualmente)
}

// ─────────────────────────────────────────
// Permisos por rol (helpers usados en components y API Routes)
// ─────────────────────────────────────────

/** Determina si un rol puede ver todos los equipos sin filtro */
export function canViewAllEquipment(role: UserRole): boolean {
  return ['superadmin', 'admin', 'visualizador'].includes(role)
}

/** Determina si un rol puede crear equipos */
export function canCreateEquipment(role: UserRole): boolean {
  return ['superadmin', 'admin', 'recepcion'].includes(role)
}

/** Determina si un rol puede eliminar equipos */
export function canDeleteEquipment(role: UserRole): boolean {
  return ['superadmin', 'admin'].includes(role)
}

/** Determina si un rol puede exportar datos */
export function canExportData(role: UserRole): boolean {
  return ['superadmin', 'admin', 'visualizador'].includes(role)
}

/** Determina si un rol puede ver estadísticas */
export function canViewStats(role: UserRole): boolean {
  return ['superadmin', 'admin', 'visualizador'].includes(role)
}

/** Determina si un rol puede forzar estados (override) */
export function canForceStatus(role: UserRole): boolean {
  return role === 'superadmin'
}

/** Ruta de inicio según el rol del usuario al hacer login */
export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  superadmin:   '/admin/usuarios',
  admin:        '/dashboard',
  operaciones:  '/taller',
  recepcion:    '/equipos',
  almacen:      '/equipos',
  visualizador: '/pizarra',
}

/** Items del sidebar visibles según el rol */
export const SIDEBAR_ITEMS_BY_ROLE: Record<UserRole, string[]> = {
  superadmin:   ['usuarios', 'dashboard', 'pizarra', 'equipos', 'workflow', 'catalogo', 'estadisticas', 'dna', 'perfil'],
  admin:        ['dashboard', 'pizarra', 'equipos', 'historial', 'estadisticas', 'dna', 'perfil'],
  operaciones:  ['taller', 'pizarra', 'buscar', 'dna', 'perfil'],
  recepcion:    ['equipos', 'pizarra', 'buscar', 'dna', 'perfil'],
  almacen:      ['equipos', 'pizarra', 'buscar', 'dna', 'perfil'],
  visualizador: ['pizarra', 'estadisticas', 'equipos', 'dna', 'perfil'],
}
