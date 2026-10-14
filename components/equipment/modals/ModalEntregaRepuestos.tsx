// components/equipment/modals/ModalEntregaRepuestos.tsx
// Modal dedicado para que Logística (almacen, admin, superadmin) registre
// entregas de repuestos de forma independiente al estado del servicio.
// Muestra la lista de ítems solicitados como checkboxes y permite agregar
// ítems adicionales (extra) no contemplados en la solicitud original.
'use client'

import React, { useState, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { Package, Plus, Trash2, X, Send, CheckSquare, Square } from 'lucide-react'
import type { ApprovedPartItem, DeliveryLineItem } from '@/types/equipment'

interface ModalEntregaRepuestosProps {
  isOpen:         boolean
  onClose:        () => void
  equipmentId:    string
  frNumber:       string
  approvedParts:  ApprovedPartItem[]  // ítems solicitados/aprobados
  onSuccess:      () => void
}

// Ítem de la lista de solicitud con su checkbox de entrega
interface CheckedPart {
  partId:      string          // corresponde a ApprovedPartItem.id
  descripcion: string
  cantSolicitada: number
  cantEntregada:  number       // ya entregada anteriormente
  checked:     boolean         // ¿marcar para entregar en esta sesión?
  cantAEntregar: string        // cantidad a entregar ahora (editable)
  nota:        string
}

// Ítem extra (no estaba en la solicitud original)
interface ExtraRow {
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

  // ── Estado: ítems de la lista solicitada (con checkbox) ──────────────────────
  const [checkedParts, setCheckedParts] = useState<CheckedPart[]>(() =>
    approvedParts.map((p) => ({
      partId:         p.id || crypto.randomUUID(),
      descripcion:    p.descripcion,
      cantSolicitada: p.cantidad_solicitada,
      cantEntregada:  p.cantidad_entregada,
      checked:        false,
      cantAEntregar:  String(Math.max(0, p.cantidad_solicitada - p.cantidad_entregada)),
      nota:           '',
    }))
  )

  // ── Estado: ítems adicionales (no estaban en la solicitud) ───────────────────
  const [extraRows, setExtraRows] = useState<ExtraRow[]>([])

  const [observaciones, setObservaciones] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Helpers para checkedParts ────────────────────────────────────────────────
  const toggleCheck = (idx: number) =>
    setCheckedParts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, checked: !p.checked } : p))
    )

  const updateCheckedField = (
    idx: number,
    field: 'cantAEntregar' | 'nota',
    value: string
  ) =>
    setCheckedParts((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    )

  // ── Helpers para extraRows ───────────────────────────────────────────────────
  const addExtraRow = () =>
    setExtraRows((prev) => [...prev, { descripcion: '', cantidad: '1', nota: '' }])

  const removeExtraRow = (idx: number) =>
    setExtraRows((prev) => prev.filter((_, i) => i !== idx))

  const updateExtraRow = (idx: number, field: keyof ExtraRow, value: string) =>
    setExtraRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    )

  // ── Resumen de selección ─────────────────────────────────────────────────────
  const selectedCount = useMemo(
    () => checkedParts.filter((p) => p.checked).length,
    [checkedParts]
  )

  const pendingCount = useMemo(
    () =>
      checkedParts.filter(
        (p) => p.cantSolicitada - p.cantEntregada > 0
      ).length,
    [checkedParts]
  )

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const fromSolicitud: DeliveryLineItem[] = checkedParts
      .filter((p) => p.checked && Number(p.cantAEntregar) > 0)
      .map((p) => ({
        descripcion: p.descripcion,
        cantidad:    parseInt(p.cantAEntregar, 10) || 1,
        nota:        p.nota.trim() || undefined,
      }))

    const fromExtras: DeliveryLineItem[] = extraRows
      .filter((r) => r.descripcion.trim() && Number(r.cantidad) > 0)
      .map((r) => ({
        descripcion: r.descripcion.trim(),
        cantidad:    parseInt(r.cantidad, 10) || 1,
        nota:        r.nota.trim() || undefined,
      }))

    const items = [...fromSolicitud, ...fromExtras]

    if (items.length === 0) {
      toast.error('Marca al menos un repuesto solicitado o agrega un ítem adicional.')
      return
    }

    setIsSubmitting(true)
    try {
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

  const inputCls =
    'bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:outline-none transition-all'

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-bg-elevated/85 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[640px] max-h-[90vh] overflow-y-auto bg-bg-surface border border-neon-blue/20 rounded-xl shadow-neon-blue z-50 font-sans text-text-primary animate-in fade-in zoom-in-95 duration-150 scrollbar-thin">

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

          <div className="px-5 py-5 space-y-6">

            {/* ── Sección 1: Repuestos Solicitados (checkboxes) ── */}
            {approvedParts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare size={11} className="text-neon-blue" />
                    Repuestos Solicitados — Marcar como Entregado
                  </p>
                  {pendingCount > 0 && (
                    <span className="text-[9px] text-yellow-400 font-semibold">
                      {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="rounded-lg border border-border-subtle overflow-hidden">
                  {/* Encabezados */}
                  <div className="grid grid-cols-[24px_1fr_64px_64px_64px_80px_100px] gap-1 px-3 py-2 bg-bg-elevated/40 text-[9px] font-bold text-text-muted uppercase tracking-wider">
                    <span />
                    <span>Descripción</span>
                    <span className="text-center">Solicit.</span>
                    <span className="text-center">Entregado</span>
                    <span className="text-center">Saldo</span>
                    <span className="text-center">A Entregar</span>
                    <span>Nota</span>
                  </div>

                  {checkedParts.map((part, idx) => {
                    const saldo = part.cantSolicitada - part.cantEntregada
                    const completo = saldo <= 0
                    return (
                      <div
                        key={part.partId}
                        className={`grid grid-cols-[24px_1fr_64px_64px_64px_80px_100px] gap-1 items-center px-3 py-2.5 border-t border-border-subtle/50 transition-colors ${
                          part.checked
                            ? 'bg-neon-blue/5'
                            : completo
                            ? 'bg-emerald-400/5 opacity-60'
                            : 'hover:bg-bg-elevated/20'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => !completo && toggleCheck(idx)}
                          disabled={completo}
                          className={`flex items-center justify-center transition-colors ${
                            completo
                              ? 'text-emerald-400 cursor-default'
                              : part.checked
                              ? 'text-neon-blue'
                              : 'text-text-muted hover:text-neon-blue'
                          }`}
                        >
                          {completo ? (
                            <CheckSquare size={14} />
                          ) : part.checked ? (
                            <CheckSquare size={14} />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>

                        {/* Descripción */}
                        <span className={`text-xs truncate ${completo ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                          {part.descripcion}
                        </span>

                        {/* Solicitado */}
                        <span className="text-xs text-center text-text-secondary font-mono">
                          {part.cantSolicitada}
                        </span>

                        {/* Entregado previamente */}
                        <span className="text-xs text-center font-mono text-emerald-400">
                          {part.cantEntregada}
                        </span>

                        {/* Saldo */}
                        <span className={`text-xs text-center font-mono font-bold ${completo ? 'text-emerald-400' : 'text-yellow-400'}`}>
                          {completo ? '✓' : saldo}
                        </span>

                        {/* Cantidad a entregar ahora */}
                        <input
                          type="number"
                          min={1}
                          max={saldo}
                          value={part.cantAEntregar}
                          disabled={!part.checked || completo}
                          onChange={(e) => updateCheckedField(idx, 'cantAEntregar', e.target.value)}
                          className={`${inputCls} text-center w-full disabled:opacity-40 disabled:cursor-not-allowed`}
                        />

                        {/* Nota */}
                        <input
                          type="text"
                          value={part.nota}
                          disabled={!part.checked || completo}
                          onChange={(e) => updateCheckedField(idx, 'nota', e.target.value)}
                          placeholder="Observación"
                          className={`${inputCls} w-full disabled:opacity-40 disabled:cursor-not-allowed`}
                        />
                      </div>
                    )
                  })}
                </div>

                {selectedCount > 0 && (
                  <p className="text-[10px] text-neon-blue font-semibold">
                    {selectedCount} ítem{selectedCount !== 1 ? 's' : ''} marcado{selectedCount !== 1 ? 's' : ''} para entrega
                  </p>
                )}
              </div>
            )}

            {/* ── Sección 2: Ítems Adicionales (no estaban en la solicitud) ── */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
                <Plus size={11} /> Ítems Adicionales
                <span className="text-text-muted font-normal normal-case">(no incluidos en la solicitud)</span>
              </p>

              {extraRows.length > 0 && (
                <>
                  <div className="grid grid-cols-[1fr_70px_120px_32px] gap-1.5 px-1">
                    <span className="text-[9px] font-bold text-text-muted uppercase">Descripción</span>
                    <span className="text-[9px] font-bold text-text-muted uppercase text-center">Cant.</span>
                    <span className="text-[9px] font-bold text-text-muted uppercase">Nota / Compatible</span>
                    <span />
                  </div>

                  {extraRows.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_70px_120px_32px] gap-1.5 items-center">
                      <input
                        type="text"
                        value={row.descripcion}
                        onChange={(e) => updateExtraRow(idx, 'descripcion', e.target.value)}
                        placeholder="Ej: Carbones de repuesto"
                        className={inputCls}
                      />
                      <input
                        type="number"
                        value={row.cantidad}
                        min={1}
                        onChange={(e) => updateExtraRow(idx, 'cantidad', e.target.value)}
                        className={`${inputCls} text-center`}
                      />
                      <input
                        type="text"
                        value={row.nota}
                        onChange={(e) => updateExtraRow(idx, 'nota', e.target.value)}
                        placeholder="Compatible / Observación"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => removeExtraRow(idx)}
                        className="flex items-center justify-center text-text-muted hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </>
              )}

              <button
                type="button"
                onClick={addExtraRow}
                className="flex items-center gap-1.5 text-[10px] text-neon-blue hover:text-neon-blue/80 font-semibold transition-colors"
              >
                <Plus size={12} /> Agregar ítem adicional
              </button>
            </div>

            {/* ── Observaciones ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Observaciones Generales
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Falta 1 unidad que llega mañana de Lima..."
                rows={2}
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:outline-none transition-all resize-none"
              />
            </div>

            {/* ── Acciones ── */}
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
