// components/equipment/StatusChangeModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'
import StatusBadge from './StatusBadge'

interface StatusChangeModalProps {
  isOpen: boolean
  onClose: () => void
  equipmentId: string
  currentStatusId: number
  currentStatusName: string
  currentStatusColor: string
  nextStates: Array<{ id: number; name: string }>
  onSuccess: () => void
}

export default function StatusChangeModal({
  isOpen,
  onClose,
  equipmentId,
  currentStatusId,
  currentStatusName,
  currentStatusColor,
  nextStates,
  onSuccess,
}: StatusChangeModalProps) {
  const { user, profile, role } = useUser()
  const [targetStatusId, setTargetStatusId] = useState<string>('')
  const [selectedTechIds, setSelectedTechIds] = useState<number[]>([])
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Superadmin override status
  const [isOverride, setIsOverride] = useState(false)
  const [allStates, setAllStates] = useState<Array<{ id: number; name: string }>>([])
  const [overrideReason, setOverrideReason] = useState('')

  // Technicians list
  const [techs, setTechs] = useState<Array<{ id: number; username: string }>>([])
  const [loadingTechs, setLoadingTechs] = useState(false)

  const [reportNumber, setReportNumber] = useState('')

  // Target state object
  const selectedStateObj = isOverride
    ? allStates.find((s) => s.id === parseInt(targetStatusId, 10))
    : nextStates.find((s) => s.id === parseInt(targetStatusId, 10))

  const isTargetDiagnosis = selectedStateObj?.name.trim().toLowerCase() === 'en diagnóstico'
  const isTargetMaintenance = selectedStateObj?.name.trim().toLowerCase() === 'en mantenimiento'
  const isTargetApproval = selectedStateObj?.name.trim().toLowerCase() === 'pendiente de aprobación' || selectedStateObj?.name.trim().toLowerCase() === 'aprobado'

  const requiresTech = isTargetDiagnosis || isTargetMaintenance
  // El número de informe ya no es obligatorio ni se solicita en el modal
  const requiresReportNumber = false

  // Fetch techs if needed
  useEffect(() => {
    if (isOpen) {
      setLoadingTechs(true)
      fetch('/api/users/technicians')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // Mapeamos de vuelta a id numérico ya que la API lo manda como string para compatibilidad legacy
            const formatted = (data.data || []).map((t: any) => ({
              id: parseInt(t.id, 10),
              username: t.username
            }))
            setTechs(formatted)
          }
        })
        .catch((err) => console.error('Error loading techs:', err))
        .finally(() => setLoadingTechs(false))
    }
  }, [isOpen])

  // Fetch all states for superadmin override
  useEffect(() => {
    if (isOpen && role === 'superadmin') {
      fetch('/api/workflow/states')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAllStates(data.data || [])
          }
        })
        .catch((err) => console.error('Error loading all states:', err))
    }
  }, [isOpen, role])

  // Reset form when opened/closed
  useEffect(() => {
    if (isOpen) {
      setTargetStatusId('')
      setSelectedTechIds([])
      setNotes('')
      setIsOverride(false)
      setOverrideReason('')
      setReportNumber('')
    }
  }, [isOpen])

  const toggleTechnician = (id: number) => {
    setSelectedTechIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetStatusId) {
      toast.error('Debe seleccionar un estado destino')
      return
    }

    if (requiresTech && selectedTechIds.length === 0) {
      toast.error('Debe asignar al menos un técnico')
      return
    }

    if (isOverride && !overrideReason.trim()) {
      toast.error('Debe especificar el motivo del override')
      return
    }

    setIsSubmitting(true)

    try {
      const endpoint = isOverride
        ? `/api/equipment/${equipmentId}/force-status`
        : `/api/equipment/${equipmentId}/update-status`

      const payload: Record<string, any> = isOverride
        ? {
            new_status_id: parseInt(targetStatusId, 10),
            override_reason: overrideReason,
          }
        : {
            new_status_id: parseInt(targetStatusId, 10),
            notes: notes,
            report_number: requiresReportNumber ? reportNumber : undefined,
            diagnosis_tech_id: isTargetDiagnosis ? selectedTechIds[0].toString() : null, // Legacy support
            maintenance_tech_id: isTargetMaintenance ? selectedTechIds[0].toString() : null, // Legacy support
            assigned_technician_ids: selectedTechIds, // New multi-tech support
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const resData = await response.json()

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Ocurrió un error al actualizar el estado')
      }

      toast.success(
        isOverride
          ? `Estado forzado con éxito a ${resData.data?.new_status_name}`
          : `Estado actualizado con éxito a ${resData.data?.new_status_name}`
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al actualizar el estado')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSuperadmin = role === 'superadmin'

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-bg-base/85 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] bg-bg-surface border border-neon-blue/30 rounded-xl shadow-neon-blue p-6 md:p-8 z-50 font-sans text-text-primary animate-in fade-in zoom-in-95 duration-150">
          <Dialog.Title className="text-xl font-bold text-neon-blue mb-4 flex items-center gap-2">
            ⚙️ Actualizar Estado
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Estado Actual */}
            <div className="flex justify-between items-center bg-bg-elevated p-3 rounded-lg border border-border-subtle">
              <span className="text-xs font-semibold text-text-secondary uppercase">Estado Actual</span>
              <StatusBadge status={currentStatusName} color={currentStatusColor} />
            </div>

            {/* Selector de Modo (Normal u Override) */}
            {isSuperadmin && (
              <div className="flex items-center gap-2 p-2 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                <input
                  type="checkbox"
                  id="override-checkbox"
                  checked={isOverride}
                  onChange={(e) => {
                    setIsOverride(e.target.checked)
                    setTargetStatusId('')
                    setSelectedTechIds([])
                  }}
                  className="w-4 h-4 text-neon-purple bg-bg-base border-border-subtle rounded focus:ring-neon-purple focus:ring-2 focus:ring-offset-bg-base"
                />
                <label htmlFor="override-checkbox" className="text-xs font-bold text-neon-purple cursor-pointer uppercase tracking-wider">
                  ⚡ Activar Override de Superadmin
                </label>
              </div>
            )}

            {/* Selección de nuevo estado */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {isOverride ? 'Forzar a Estado Destino *' : 'Siguiente Estado *'}
              </label>
              <select
                value={targetStatusId}
                onChange={(e) => setTargetStatusId(e.target.value)}
                required
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,229,255,0.2)] focus:outline-none transition-all"
              >
                <option value="" disabled>Seleccione un estado...</option>
                {isOverride
                  ? allStates
                      .filter((s) => s.id !== currentStatusId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))
                  : nextStates.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
              </select>
            </div>

            {/* Número de Informe Condicional */}
            {requiresReportNumber && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neon-blue uppercase tracking-wider">
                  Número de Informe *
                </label>
                <input
                  type="text"
                  value={reportNumber}
                  onChange={(e) => setReportNumber(e.target.value)}
                  placeholder="Ej: INF-001"
                  required
                  className="w-full bg-bg-elevated border border-neon-blue/50 rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,229,255,0.2)] focus:outline-none transition-all uppercase font-mono"
                />
              </div>
            )}

            {/* Asignación de Técnico Condicional */}
            {requiresTech && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
                  {isTargetDiagnosis ? 'Asignar Técnico(s) de Diagnóstico *' : 'Asignar Técnico(s) de Mantenimiento *'}
                </label>
                <div className="flex flex-wrap gap-2 p-1">
                  {loadingTechs ? (
                    <span className="text-[10px] text-text-muted animate-pulse font-mono">Cargando personal...</span>
                  ) : (
                    techs.map((t) => {
                      const isSelected = selectedTechIds.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTechnician(t.id)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                            isSelected 
                              ? 'bg-neon-blue/20 border-neon-blue text-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.2)]' 
                              : 'bg-bg-elevated border-border-subtle text-text-muted hover:border-white/20'
                          }`}
                        >
                          {t.username.toUpperCase()}
                        </button>
                      )
                    })
                  )}
                  {!loadingTechs && techs.length === 0 && (
                    <span className="text-[10px] text-red-400 font-mono">No se encontró personal activo</span>
                  )}
                </div>
              </div>
            )}

            {/* Notas / Observaciones */}
            {!isOverride ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Observaciones adicionales
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escriba aquí observaciones sobre este cambio de estado..."
                  rows={3}
                  className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,229,255,0.2)] focus:outline-none transition-all resize-none"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neon-purple uppercase tracking-wider">
                  Motivo del Override de Superadmin *
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Debe ingresar la justificación para forzar este estado..."
                  required
                  rows={3}
                  className="w-full bg-bg-elevated border border-neon-purple/50 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-purple focus:shadow-[0_0_8px_rgba(157,78,221,0.2)] focus:outline-none transition-all resize-none"
                />
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold border border-neon-blue text-neon-blue rounded-lg hover:bg-neon-blue/10 transition-all uppercase"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2 text-sm font-semibold rounded-lg text-white transition-all uppercase ${
                  isOverride
                    ? 'bg-neon-purple shadow-neon-purple hover:brightness-110'
                    : 'bg-electric hover:shadow-neon-blue hover:brightness-110'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
