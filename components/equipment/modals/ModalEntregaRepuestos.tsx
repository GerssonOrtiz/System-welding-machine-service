// components/equipment/modals/ModalEntregaRepuestos.tsx
// Modal dedicado para que Logística (almacen, admin, superadmin) registre
// entregas de repuestos de forma independiente al estado del servicio.
'use client'

import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { Package, Plus, Trash2, X, Send } from 'lucide-react'
import type { ApprovedPartItem, DeliveryLineItem } from '@/types/equipment'

interface ModalEntregaRepuestosProps {
  isOpen:         boolean
  onClose:        () => void
  equipmentId:    string
  frNumber:       string
  approvedParts:  ApprovedPartItem[]  // ítems aprobados por Ventas
  onSuccess:      () => void
}

interface DeliveryRow {
  descripcion: string
  cantidad:    string
  nota:        string
}

export default function ModalEntregaRepuestos({
  isOpen,
  onClose,
  equipmentId,
  frNumber,
  approvedParts,
  onSuccess,
}: ModalEntregaRepuestosProps) {
  const [rows, setRows] = useState<DeliveryRow[]>(() =>
    approvedParts.length > 0
      ? approvedParts.map((p) => ({
          descripcion: p.descripcion,
          cantidad:    '1',
          nota:        '',
        }))
      : [{ descripcion: '', cantidad: '1', nota: '' }]
  )
  const [observaciones, setObservaciones] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addRow = () => {
    setRows((prev) => [...prev, { descripcion: '', cantidad: '1', nota: '' }])
  }

  const removeRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, field: keyof DeliveryRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  const handleSubmit = async () => {
    const validRows = rows.filter((r) => r.descripcion.trim() && Number(r.cantidad) > 0)
    if (validRows.length === 0) {
      toast.error('Agrega al menos un ítem con descripción y cantidad válida.')
      return
    }

    setIsSubmitting(true)
    try {
      const items: DeliveryLineItem[] = validRows.map((r) => ({
        descripcion: r.descripcion.trim(),
        cantidad:    parseInt(r.cantidad, 10) || 1,
        nota:        r.nota.trim() || undefined,
      }))

      const res = await fetch(`/api/equipment/${equipmentId}/deliver-parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, observaciones: observaciones.trim() }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al registrar la entrega')
      }

      if (data.warning) toast.warning(data.warning)
      toast.success('Entrega de repuestos registrada con éxito')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error inesperado al registrar la entrega')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Saldo pendiente por ítem (solo si hay approved_parts)
  const getSaldo = (descripcion: string, cantidadEntregando: number): number | null => {
    if (approvedParts.length === 0) return null
    const part = approvedParts.find(
      (p) => p.descripcion.trim().toLowerCase() === descripcion.trim().toLowerCase()
    )
    if (!part) return null
    return Math.max(0, part.cantidad_solicitada - part.cantidad_entregada - cantidadEntregando)
  }

  const inputCls =
    'bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:outline-none transition-all'

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-bg-elevated/85 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-bg-surface border border-neon-blue/20 rounded-xl shadow-neon-blue z-50 font-sans text-text-primary animate-in fade-in zoom-in-95 duration-150 scrollbar-thin">
          {/* Cabecera */}
          <div className="sticky top-0 z-10 bg-bg-surface border-b border-border-subtle px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-neon-blue" />
              <Dialog.Title className="text-sm font-bold text-neon-blue">
                Registrar Entrega de Repuestos
              </Dialog.Title>
              <span className="text-xs text-text-muted font-mono">— {frNumber}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="px-5 py-5 space-y-5">

            {/* Tabla de repuestos aprobados (referencia) */}
            {approvedParts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Control de Repuestos Aprobados
                </p>
                <div className="rounded-lg border border-border-subtle overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-bg-elevated/40 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        <th className="px-3 py-2 text-left">Repuesto / Insumo</th>
                        <th className="px-3 py-2 text-center">Solicitado</th>
                        <th className="px-3 py-2 text-center">Entregado</th>
                        <th className="px-3 py-2 text-center">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/50">
                      {approvedParts.map((part, idx) => {
                        const saldo = part.cantidad_solicitada - part.cantidad_entregada
                        return (
                          <tr key={part.id || idx} className="hover:bg-bg-elevated/20">
                            <td className="px-3 py-2 text-text-primary">{part.descripcion}</td>
                            <td className="px-3 py-2 text-center text-text-secondary font-mono">
                              {part.cantidad_solicitada}
                            </td>
                            <td className="px-3 py-2 text-center font-mono text-emerald-400">
                              {part.cantidad_entregada}
                            </td>
                            <td className="px-3 py-2 text-center font-mono font-bold">
                              <span className={saldo > 0 ? 'text-yellow-400' : 'text-emerald-400'}>
                                {saldo > 0 ? saldo : '✓'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Formulario de entrega */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
                <Package size={11} /> Ítems a Entregar Ahora *
              </p>

              {/* Headers */}
              <div className="grid grid-cols-[1fr_70px_120px_32px] gap-1.5 px-1">
                <span className="text-[9px] font-bold text-text-muted uppercase">Descripción</span>
                <span className="text-[9px] font-bold text-text-muted uppercase text-center">Cant.</span>
                <span className="text-[9px] font-bold text-text-muted uppercase">Nota / Compatible</span>
                <span />
              </div>

              {rows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_70px_120px_32px] gap-1.5 items-center">
                  <input
                    type="text"
                    value={row.descripcion}
                    onChange={(e) => updateRow(idx, 'descripcion', e.target.value)}
                    placeholder="Ej: Carbones de repuesto"
                    className={inputCls}
                  />
                  <input
                    type="number"
                    value={row.cantidad}
                    min={1}
                    onChange={(e) => updateRow(idx, 'cantidad', e.target.value)}
                    className={`${inputCls} text-center`}
                  />
                  <input
                    type="text"
                    value={row.nota}
                    onChange={(e) => updateRow(idx, 'nota', e.target.value)}
                    placeholder="Compatible / Observación"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    disabled={rows.length === 1}
                    className="flex items-center justify-center text-text-muted hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1.5 text-[10px] text-neon-blue hover:text-neon-blue/80 font-semibold transition-colors"
              >
                <Plus size={12} /> Agregar ítem
              </button>
            </div>

            {/* Observaciones */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Falta 1 unidad que llega mañana de Lima..."
                rows={2}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-border-subtle text-text-secondary hover:bg-bg-elevated text-xs font-bold uppercase transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-neon-blue text-bg-base text-xs font-bold uppercase hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={12} />
                {isSubmitting ? 'Registrando...' : 'Confirmar Entrega'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
