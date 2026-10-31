// hooks/useRealtimePizarra.ts
'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Instancia singleton del cliente Supabase — creada a nivel de módulo para
// evitar que se recree en cada render del hook.
const supabase = createClient()

export function useRealtimePizarra(onTriggerRefetch?: () => void) {
  const [equipments, setEquipments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Ref estable para el callback — evita que sea una dependencia inestable
  // del useEffect principal, previniendo re-suscripciones en cada render.
  const onTriggerRefetchRef = useRef(onTriggerRefetch)
  useEffect(() => {
    onTriggerRefetchRef.current = onTriggerRefetch
  })

  useEffect(() => {
    // 1. Carga inicial — todos los equipos no entregados
    async function loadInitialData() {
      try {
        const { data, error } = await supabase
          .from('equipment_with_status')
          .select('*')
          .eq('is_terminal', false)
          .order('fr_number', { ascending: false })

        if (error) {
          console.error('[useRealtimePizarra] Load error:', error)
        }
        setEquipments((data as any[]) || [])
      } catch (err) {
        console.error('[useRealtimePizarra] Unexpected load error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()

    // 2. Suscripción Realtime
    const channel = supabase
      .channel('pizarra-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment_records',
        },
        async (payload: any) => {
          console.log('[Realtime] postgres_changes payload:', payload)

          if (payload.eventType === 'INSERT') {
            const { data, error } = await supabase
              .from('equipment_with_status')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (error) {
              console.error('[Realtime INSERT] Join fetch error:', error)
            }
            if (data) {
              const activeData = data as any
              if (!activeData.is_terminal) {
                setEquipments((prev) => [...prev, activeData])
              }
            }
          }

          if (payload.eventType === 'UPDATE') {
            const updatedId = payload.new.id

            // Si cambió a estado terminal: remover de la pizarra
            const { data: targetState } = await supabase
              .from('workflow_states')
              .select('is_terminal')
              .eq('id', payload.new.current_status_id)
              .single()

            const activeTargetState = targetState as any
            if (activeTargetState?.is_terminal) {
              setEquipments((prev) => prev.filter((e) => e.id !== updatedId))
              return
            }

            // Actualizar equipo con datos frescos (incluyendo JOIN)
            const { data, error } = await supabase
              .from('equipment_with_status')
              .select('*')
              .eq('id', updatedId)
              .single()

            if (error) {
              console.error('[Realtime UPDATE] Join fetch error:', error)
            }

            if (data) {
              const activeData = data as any
              if (activeData.is_terminal) {
                setEquipments((prev) => prev.filter((e) => e.id !== updatedId))
              } else {
                setEquipments((prev) =>
                  prev.map((e) => (e.id === updatedId ? activeData : e))
                )
              }
            }
          }

          if (payload.eventType === 'DELETE') {
            setEquipments((prev) => prev.filter((e) => e.id !== payload.old.id))
          }

          // Invocar callback via ref para no necesitarlo como dependencia
          onTriggerRefetchRef.current?.()
        }
      )
      .subscribe()

    // 3. Cleanup al desmontar el componente
    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // Array vacío: solo se ejecuta al montar/desmontar

  // Ordenar equipos: Prioridad primero (VIP 3 > VIP 2 > VIP 1 > Regular), luego FR descendente
  const sortedEquipments = [...equipments].sort((a, b) => {
    const aPrio = a.priority_level || (a.is_priority ? 1 : 0)
    const bPrio = b.priority_level || (b.is_priority ? 1 : 0)

    if (aPrio !== bPrio) {
      return bPrio - aPrio
    }
    return (b.fr_number || '').localeCompare(a.fr_number || '', undefined, { numeric: true, sensitivity: 'base' })
  })

  // Agrupar por estado para renderizar columnas en la pizarra
  const groupedByStatus = sortedEquipments.reduce((acc, equipment) => {
    const statusName = equipment.status_name
    if (!acc[statusName]) acc[statusName] = []
    acc[statusName].push(equipment)
    return acc
  }, {} as Record<string, any[]>)

  return { equipments: sortedEquipments, groupedByStatus, isLoading }
}
