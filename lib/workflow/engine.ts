// lib/workflow/engine.ts
// Motor de workflow dinámico de CABELAB v2.0
// Carga transiciones y estados desde la base de datos de Supabase para admitir modificaciones del superadmin en caliente.

import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

export type WorkflowState = Database['public']['Tables']['workflow_states']['Row']
export type WorkflowTransition = Database['public']['Tables']['workflow_transitions']['Row']

export class WorkflowEngine {
  /**
   * Valida si una transición es permitida para un rol dado.
   */
  static async validateTransition(
    fromStatusId: number,
    toStatusId: number,
    userRole: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const supabase = await createServerClient()

      // 1. Obtener la transición desde la BD que enlace el origen, el destino y tenga el rol permitido
      const { data: transition, error } = await supabase
        .from('workflow_transitions')
        .select('*')
        .eq('from_state_id', fromStatusId)
        .eq('to_state_id', toStatusId)
        .single()

      if (error || !transition) {
        return { isValid: false, error: 'Transición no permitida en la configuración del workflow' }
      }

      // 2. Verificar que el rol del usuario esté contenido en la lista de roles autorizados
      const allowedRoles = (transition as any).allowed_roles as string[]
      const isAllowed = allowedRoles.includes(userRole)
      if (!isAllowed) {
        return { isValid: false, error: `Tu rol no cuenta con permisos para mover el equipo a este estado` }
      }

      return { isValid: true }
    } catch (err) {
      console.error('[WorkflowEngine.validateTransition] Error:', err)
      return { isValid: false, error: 'Error al validar transición en el servidor' }
    }
  }

  /**
   * Retorna los estados a los que se puede transicionar desde el estado actual según el rol del usuario.
   */
  static async getNextStates(
    currentStatusId: number,
    userRole: string
  ): Promise<WorkflowState[]> {
    try {
      const supabase = await createServerClient()

      // 1. Obtener las transiciones permitidas saliendo desde el estado actual
      const { data: transitions } = await supabase
        .from('workflow_transitions')
        .select('to_state_id, allowed_roles')
        .eq('from_state_id', currentStatusId)

      if (!transitions || transitions.length === 0) {
        return []
      }

      // 2. Filtrar transiciones que incluyan el rol del usuario
      const targetStateIds = (transitions as any[])
        .filter((t) => t.allowed_roles && t.allowed_roles.includes(userRole))
        .map((t) => t.to_state_id as number)

      if (targetStateIds.length === 0) {
        return []
      }

      // 3. Obtener los estados destinos correspondientes a los IDs filtrados ordenados por order_index
      const { data: states } = await supabase
        .from('workflow_states')
        .select('*')
        .in('id', targetStateIds)
        .order('order_index', { ascending: true })

      return (states as any[]) || []
    } catch (err) {
      console.error('[WorkflowEngine.getNextStates] Error:', err)
      return []
    }
  }

  /**
   * Retorna si un estado determinado es terminal.
   */
  static async isTerminal(statusId: number): Promise<boolean> {
    try {
      const supabase = await createServerClient()
      const { data: state } = await supabase
        .from('workflow_states')
        .select('is_terminal')
        .eq('id', statusId)
        .single()

      return (state as any)?.is_terminal ?? false
    } catch (err) {
      console.error('[WorkflowEngine.isTerminal] Error:', err)
      return false
    }
  }
}
