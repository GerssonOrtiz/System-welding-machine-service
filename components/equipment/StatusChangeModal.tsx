// components/equipment/StatusChangeModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'
import StatusBadge from './StatusBadge'
import ModalInformeODP from './modals/ModalInformeODP'
import ModalAprobacionVentas, { VentasItem } from './modals/ModalAprobacionVentas'
import ModalEntregaLogistica, { LogisticaItem } from './modals/ModalEntregaLogistica'
import ModalCulminadoODP from './modals/ModalCulminadoODP'

// Estados que muestran un sub-modal de correo (en minúsculas)
const ESTADO_INFORME_ODP       = 'pendiente de aprobación'
const ESTADO_APROBACION_VENTAS = 'aprobado'
const ESTADO_ENTREGA_LOGISTICA = 'en espera de repuesto'
const ESTADO_CULMINADO_ODP     = 'listo para entrega'

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
  const { role } = useUser()

  // ── Estado base ──────────────────────────────────────────────────────────
  const [targetStatusId, setTargetStatusId]   = useState<string>('')
  const [selectedTechIds, setSelectedTechIds] = useState<number[]>([])
  const [notes, setNotes]                     = useState<string>('')
  const [isSubmitting, setIsSubmitting]       = useState(false)

  // ── Superadmin override ──────────────────────────────────────────────────
  const [isOverride, setIsOverride]           = useState(false)
  const [allStates, setAllStates]             = useState<Array<{ id: number; name: string }>>([])
  const [overrideReason, setOverrideReason]   = useState('')
  const [notifyByEmail, setNotifyByEmail]     = useState(false)

  // ── Técnicos ─────────────────────────────────────────────────────────────
  const [techs, setTechs]           = useState<Array<{ id: number; username: string }>>([])
  const [loadingTechs, setLoadingTechs] = useState(false)

  // ── Campos sub-modales de correo ─────────────────────────────────────────
  // Informe ODP
  const [diagnostico, setDiagnostico] = useState('')
  const [pdfFile, setPdfFile]         = useState<File | null>(null)
  const [reportUrl, setReportUrl]     = useState('')
  // Aprobación Ventas
  const [ventasItems, setVentasItems]           = useState<VentasItem[]>([{ descripcion: '', cantidad: '1', precio: '' }])
  const [ventasObservaciones, setVentasObs]     = useState('')
  // Entrega Logística
  const [logisticaItems, setLogisticaItems]     = useState<LogisticaItem[]>([{ descripcion: '', cantidad: '1', nota: '' }])
  const [logisticaObservaciones, setLogisticaObs] = useState('')
  // Culminado ODP
  const [culminadoObs, setCulminadoObs]         = useState('')

  // ── Estado destino seleccionado ──────────────────────────────────────────
  const selectedStateObj = isOverride
    ? allStates.find(s => s.id === parseInt(targetStatusId, 10))
    : nextStates.find(s => s.id === parseInt(targetStatusId, 10))

  const targetNameLower = selectedStateObj?.name.trim().toLowerCase() ?? ''
  const isTargetDiagnosis   = targetNameLower === 'en diagnóstico'
  const isTargetMaintenance = targetNameLower === 'en mantenimiento'
  const requiresTech        = isTargetDiagnosis || isTargetMaintenance

  const showInformeODP       = !isOverride && targetNameLower === ESTADO_INFORME_ODP
  const showAprobacionVentas = !isOverride && targetNameLower === ESTADO_APROBACION_VENTAS
  const showEntregaLogistica = !isOverride && targetNameLower === ESTADO_ENTREGA_LOGISTICA
  const showCulminadoODP     = !isOverride && targetNameLower === ESTADO_CULMINADO_ODP

  // ── Fetch técnicos ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setLoadingTechs(true)
      fetch('/api/users/technicians')
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setTechs((data.data || []).map((t: any) => ({ id: parseInt(t.id, 10), username: t.username })))
          }
        })
        .catch(err => console.error('Error loading techs:', err))
        .finally(() => setLoadingTechs(false))
    }
  }, [isOpen])

  // ── Fetch all states (superadmin) ────────────────────────────────────────
  useEffect(() => {
    if (isOpen && role === 'superadmin') {
      fetch('/api/workflow/states')
        .then(r => r.json())
        .then(data => { if (data.success) setAllStates(data.data || []) })
        .catch(err => console.error('Error loading states:', err))
    }
  }, [isOpen, role])

  // ── Reset al abrir/cerrar ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTargetStatusId('')
      setSelectedTechIds([])
      setNotes('')
      setIsOverride(false)
      setOverrideReason('')
      setNotifyByEmail(false)
      setDiagnostico('')
      setPdfFile(null)
      setVentasItems([{ descripcion: '', cantidad: '1', precio: '' }])
      setVentasObs('')
      setLogisticaItems([{ descripcion: '', cantidad: '1', nota: '' }])
      setLogisticaObs('')
      setCulminadoObs('')
    }
  }, [isOpen])

  const toggleTechnician = (id: number) => {
    setSelectedTechIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetStatusId) { toast.error('Debe seleccionar un estado destino'); return }
    if (requiresTech && selectedTechIds.length === 0) { toast.error('Debe asignar al menos un técnico'); return }
    if (isOverride && !overrideReason.trim()) { toast.error('Debe especificar el motivo del override'); return }

    // Validaciones por evento de correo
    if (showInformeODP) {
      if (!diagnostico.trim()) { toast.error('El diagnóstico técnico es obligatorio'); return }
      if (!pdfFile) { toast.error('Debe adjuntar el PDF del informe'); return }
    }
    if (showAprobacionVentas) {
      const valid = ventasItems.every(i => i.descripcion.trim() && i.cantidad.trim() && i.precio.trim())
      if (!valid) { toast.error('Complete todos los campos de la tabla de aprobación'); return }
    }
    if (showEntregaLogistica) {
      const valid = logisticaItems.every(i => i.descripcion.trim() && i.cantidad.trim())
      if (!valid) { toast.error('Complete descripción y cantidad de cada repuesto'); return }
    }

    setIsSubmitting(true)

    try {
      const endpoint = isOverride
        ? `/api/equipment/${equipmentId}/force-status`
        : `/api/equipment/${equipmentId}/update-status`

      let response: Response

      if (isOverride) {
        // Override siempre como JSON
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            new_status_id: parseInt(targetStatusId, 10),
            override_reason: overrideReason,
            notify_by_email: notifyByEmail,
          }),
        })

      } else if (showInformeODP && pdfFile) {
        // Informe ODP como FormData (lleva PDF)
        const fd = new FormData()
        fd.append('new_status_id', targetStatusId)
        fd.append('diagnostico', diagnostico)
        if (reportUrl) fd.append('report_url', reportUrl)
        if (notes) fd.append('notes', notes)
        if (selectedTechIds.length > 0) {
          fd.append('assigned_technician_ids', JSON.stringify(selectedTechIds))
        }
        fd.append('pdf', pdfFile)
        response = await fetch(endpoint, { method: 'POST', body: fd })

      } else {
        // Resto de eventos como JSON
        const payload: Record<string, any> = {
          new_status_id: parseInt(targetStatusId, 10),
          notes: notes || null,
          assigned_technician_ids: selectedTechIds,
        }

        if (showAprobacionVentas) {
          payload.items = ventasItems
          payload.observaciones = ventasObservaciones
        } else if (showEntregaLogistica) {
          payload.items = logisticaItems
          payload.observaciones = logisticaObservaciones
        } else if (showCulminadoODP) {
          payload.observaciones = culminadoObs
        }

        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

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
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[540px] max-h-[90vh] overflow-y-auto bg-bg-surface border border-neon-blue/30 rounded-xl shadow-neon-blue p-6 md:p-8 z-50 font-sans text-text-primary animate-in fade-in zoom-in-95 duration-150">
          <Dialog.Title className="text-xl font-bold text-neon-blue mb-4 flex items-center gap-2">
            ⚙️ Actualizar Estado
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Estado Actual */}
            <div className="flex justify-between items-center bg-bg-elevated p-3 rounded-lg border border-border-subtle">
              <span className="text-xs font-semibold text-text-secondary uppercase">Estado Actual</span>
              <StatusBadge status={currentStatusName} color={currentStatusColor} />
            </div>

            {/* Override (solo superadmin) */}
            {isSuperadmin && (
              <div className="flex items-center gap-2 p-2 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                <input
                  type="checkbox"
                  id="override-checkbox"
                  checked={isOverride}
                  onChange={(e) => { setIsOverride(e.target.checked); setTargetStatusId(''); setSelectedTechIds([]) }}
                  className="w-4 h-4 text-neon-purple bg-bg-base border-border-subtle rounded focus:ring-neon-purple"
                />
                <label htmlFor="override-checkbox" className="text-xs font-bold text-neon-purple cursor-pointer uppercase tracking-wider">
                  ⚡ Activar Override de Superadmin
                </label>
              </div>
            )}

            {/* Selector de estado destino */}
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
                  ? allStates.filter(s => s.id !== currentStatusId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  : nextStates.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                }
              </select>
            </div>

            {/* Asignación de técnico (diagnóstico / mantenimiento) */}
            {requiresTech && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
                  {isTargetDiagnosis ? 'Asignar Técnico(s) de Diagnóstico *' : 'Asignar Técnico(s) de Mantenimiento *'}
                </label>
                <div className="flex flex-wrap gap-2 p-1">
                  {loadingTechs ? (
                    <span className="text-[10px] text-text-muted animate-pulse font-mono">Cargando personal...</span>
                  ) : techs.map(t => {
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
                  })}
                  {!loadingTechs && techs.length === 0 && (
                    <span className="text-[10px] text-red-400 font-mono">No se encontró personal activo</span>
                  )}
                </div>
              </div>
            )}

            {/* Sub-modal de correo según estado destino */}
            {showInformeODP && (
              <ModalInformeODP
                diagnostico={diagnostico}
                onDiagnosticoChange={setDiagnostico}
                pdfFile={pdfFile}
                onPdfChange={setPdfFile}
                reportUrl={reportUrl}
                onReportUrlChange={setReportUrl}
              />
            )}

            {showAprobacionVentas && (
              <ModalAprobacionVentas
                items={ventasItems}
                onItemsChange={setVentasItems}
                observaciones={ventasObservaciones}
                onObservacionesChange={setVentasObs}
              />
            )}

            {showEntregaLogistica && (
              <ModalEntregaLogistica
                items={logisticaItems}
                onItemsChange={setLogisticaItems}
                observaciones={logisticaObservaciones}
                onObservacionesChange={setLogisticaObs}
              />
            )}

            {showCulminadoODP && (
              <ModalCulminadoODP
                observaciones={culminadoObs}
                onObservacionesChange={setCulminadoObs}
              />
            )}

            {/* Observaciones / Motivo override */}
            {!isOverride && !showInformeODP && !showAprobacionVentas && !showEntregaLogistica && !showCulminadoODP && (
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
            )}

            {isOverride && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neon-purple uppercase tracking-wider">
                  Motivo del Override *
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Justificación para forzar este estado..."
                  required
                  rows={3}
                  className="w-full bg-bg-elevated border border-neon-purple/50 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-purple focus:shadow-[0_0_8px_rgba(157,78,221,0.2)] focus:outline-none transition-all resize-none"
                />
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neon-purple/20">
                  <input
                    type="checkbox"
                    id="notify-email-checkbox"
                    checked={notifyByEmail}
                    onChange={(e) => setNotifyByEmail(e.target.checked)}
                    className="w-4 h-4 text-neon-purple bg-bg-base border-border-subtle rounded focus:ring-neon-purple cursor-pointer"
                  />
                  <label htmlFor="notify-email-checkbox" className="text-xs text-text-secondary cursor-pointer select-none">
                    Enviar notificación interna por correo de este override
                  </label>
                </div>
              </div>
            )}

            {/* Botones */}
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
