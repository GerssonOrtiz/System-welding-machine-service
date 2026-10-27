// components/equipment/modals/ModalDevolucionRepuestos.tsx
// Modal interactivo para que Operaciones (operaciones, admin, superadmin)
// registre devoluciones o rebotes de repuestos entregados hacia Almacén.
'use client'

import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { Undo2, X, AlertTriangle, Send, CheckSquare, Square } from 'lucide-react'
import type { ApprovedPartItem, PartReturnReason } from '@/types/equipment'
import { PART_RETURN_REASON_LABELS } from '@/types/equipment'

interface ModalDevolucionRepuestosProps {
  isOpen: boolean
  onClose: () => void
  equipmentId: string
  frNumber: string
  approvedParts: ApprovedPartItem[]
  onSuccess: () => void
}

interface ReturnItemState {
  partId: string
  descripcion: string
  cantEntregada: number
  checked: boolean
  cantADevolver: string
  motivo: PartReturnReason
  detalle: string
}

export default function ModalDevolucionRepuestos({
  isOpen,
  onClose,
  equipmentId,
  frNumber,
  approvedParts,
  onSuccess,
}: ModalDevolucionRepuestosProps) {
  const [items, setItems] = useState<ReturnItemState[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtrar repuestos que efectivamente tienen cantidad_entregada > 0
  useEffect(() => {
    if (isOpen) {
      const deliveredParts = (approvedParts || []).filter((p) => (p.cantidad_entregada || 0) > 0)
      setItems(
        deliveredParts.map((p) => ({
          partId: p.id || crypto.randomUUID(),
          descripcion: p.descripcion,
          cantEntregada: p.cantidad_entregada,
          checked: false,
          cantADevolver: '1',
          motivo: 'INCOMPATIBLE',
          detalle: '',
        }))
      )
      setObservaciones('')
    }
  }, [isOpen, approvedParts])

  const toggleCheck = (idx: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item))
    )
  }

  const updateField = (idx: number, field: keyof ReturnItemState, val: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    )
  }

  const handleSelectAll = (checked: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, checked })))
  }

  const selectedItems = items.filter((i) => i.checked)

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error('Seleccione al menos un repuesto para devolver.')
      return
    }

    // Validar cantidades
    for (const item of selectedItems) {
      const cant = parseInt(item.cantADevolver, 10)
      if (isNaN(cant) || cant <= 0) {
        toast.error(`La cantidad a devolver para "${item.descripcion}" debe ser mayor a 0.`)
        return
      }
      if (cant > item.cantEntregada) {
        toast.error(
          `No puede devolver ${cant} de "${item.descripcion}". Solo hay ${item.cantEntregada} entregado(s).`
        )
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payload = {
        items: selectedItems.map((i) => ({
          descripcion: i.descripcion,
          cantidad_devuelta: parseInt(i.cantADevolver, 10),
          motivo: i.motivo,
          detalle: i.detalle.trim() || undefined,
        })),
        observaciones: observaciones.trim() || undefined,
      }

      const res = await fetch(`/api/equipment/${equipmentId}/return-parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Error al procesar la devolución de repuestos.')
        return
      }

      if (data.warning) {
        toast.warning(data.warning)
      } else {
        toast.success('Devolución registrada correctamente y notificada a Logística.')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error('Ocurrió un error inesperado al conectar con el servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-bg-surface border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden text-text-primary font-sans animate-scale-up">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <Undo2 size={20} />
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-white flex items-center gap-2">
                  Devolución de Repuestos a Almacén
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-md bg-white/[0.06] text-cyan-300 border border-white/10">
                    {frNumber}
                  </span>
                </Dialog.Title>
                <Dialog.Description className="text-xs text-text-secondary mt-0.5">
                  Rebota piezas entregadas que resultaron incompatibles, defectuosas o no requeridas.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Cuerpo */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Aviso informativo */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
              <AlertTriangle size={18} className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-200">Impacto en el flujo operativo:</p>
                <p className="text-amber-300/90 mt-0.5">
                  Al rebotar repuestos, se restarán de las cantidades entregadas en el equipo y el estado de repuestos podrá retroceder a <strong>Parcial</strong> o <strong>Sin repuestos</strong>. Se enviará una notificación formal en el hilo a Logística.
                </p>
              </div>
            </div>

            {/* Lista de repuestos entregados */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Repuestos Entregados Disponibles para Devolución
                </span>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectAll(selectedItems.length !== items.length)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    {selectedItems.length === items.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center border border-white/10 rounded-xl bg-white/[0.01]">
                  <p className="text-sm text-slate-400">
                    Este equipo no tiene repuestos entregados registrados actualmente.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {items.map((item, idx) => (
                    <div
                      key={item.partId}
                      className={`p-3.5 rounded-xl border transition-all ${
                        item.checked
                          ? 'bg-red-500/[0.04] border-red-500/40 shadow-sm'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleCheck(idx)}
                          className="mt-0.5 text-slate-400 hover:text-white transition-colors"
                        >
                          {item.checked ? (
                            <CheckSquare size={18} className="text-red-400" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">{item.descripcion}</span>
                            <span className="text-xs font-mono text-slate-400">
                              Entregado: <strong className="text-emerald-400">{item.cantEntregada}</strong>
                            </span>
                          </div>

                          {item.checked && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-white/5">
                              {/* Cantidad a devolver */}
                              <div>
                                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                                  Cant. a Devolver (Max {item.cantEntregada})
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={item.cantEntregada}
                                  value={item.cantADevolver}
                                  onChange={(e) => updateField(idx, 'cantADevolver', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-bg-base border border-white/10 text-white text-xs focus:outline-none focus:border-red-400 font-mono"
                                />
                              </div>

                              {/* Motivo */}
                              <div>
                                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                                  Motivo de Rebote
                                </label>
                                <select
                                  value={item.motivo}
                                  onChange={(e) => updateField(idx, 'motivo', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-bg-base border border-white/10 text-white text-xs focus:outline-none focus:border-red-400"
                                >
                                  {Object.entries(PART_RETURN_REASON_LABELS).map(([k, label]) => (
                                    <option key={k} value={k} className="bg-bg-elevated text-white">
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Detalle técnico */}
                              <div>
                                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                                  Detalle / Especificación
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej: Rosca M12 incompatible"
                                  value={item.detalle}
                                  onChange={(e) => updateField(idx, 'detalle', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-bg-base border border-white/10 text-white text-xs focus:outline-none focus:border-red-400"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observaciones Generales */}
            {items.length > 0 && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Observaciones Generales para Logística (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre cuándo se recoge la pieza o solicitud de repuesto alternativo..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.02] border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || selectedItems.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {isSubmitting ? 'Registrando Devolución...' : 'Confirmar Devolución a Almacén'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
