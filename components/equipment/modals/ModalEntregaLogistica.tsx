// components/equipment/modals/ModalEntregaLogistica.tsx
'use client'

import React from 'react'
import { Package, Plus, Trash2 } from 'lucide-react'

export interface LogisticaItem {
  descripcion: string
  cantidad: string
  nota: string
}

interface ModalEntregaLogisticaProps {
  items: LogisticaItem[]
  onItemsChange: (items: LogisticaItem[]) => void
  observaciones: string
  onObservacionesChange: (v: string) => void
}

export default function ModalEntregaLogistica({
  items,
  onItemsChange,
  observaciones,
  onObservacionesChange,
}: ModalEntregaLogisticaProps) {
  const addRow = () => {
    onItemsChange([...items, { descripcion: '', cantidad: '1', nota: '' }])
  }

  const removeRow = (idx: number) => {
    onItemsChange(items.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, field: keyof LogisticaItem, value: string) => {
    const updated = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    )
    onItemsChange(updated)
  }

  return (
    <div className="space-y-4 pt-3 border-t border-neon-blue/20">
      <p className="text-[10px] font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
        <Package size={12} /> Entrega de Repuestos — Correo Logística
      </p>

      {/* Tabla de ítems */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Repuestos entregados *
        </label>

        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_70px_1fr_32px] gap-1.5 px-1">
            <span className="text-[9px] font-bold text-text-muted uppercase">Descripción</span>
            <span className="text-[9px] font-bold text-text-muted uppercase text-center">Cant.</span>
            <span className="text-[9px] font-bold text-text-muted uppercase">Nota / Compatible</span>
            <span />
          </div>

          {/* Filas */}
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_70px_1fr_32px] gap-1.5 items-center">
              <input
                type="text"
                value={item.descripcion}
                onChange={(e) => updateRow(idx, 'descripcion', e.target.value)}
                placeholder="Ej: Carbón de grafito"
                className="bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:outline-none transition-all"
              />
              <input
                type="text"
                value={item.cantidad}
                onChange={(e) => updateRow(idx, 'cantidad', e.target.value)}
                placeholder="1"
                className="bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary text-center focus:border-neon-blue focus:outline-none transition-all"
              />
              <input
                type="text"
                value={item.nota}
                onChange={(e) => updateRow(idx, 'nota', e.target.value)}
                placeholder="Reemplazo compatible (opcional)"
                className="bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
                disabled={items.length === 1}
                className="flex items-center justify-center text-text-muted hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-[10px] text-neon-blue hover:text-neon-blue/80 font-semibold transition-colors mt-1"
          >
            <Plus size={12} /> Agregar repuesto
          </button>
        </div>
      </div>

      {/* Observaciones */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Observaciones
        </label>
        <textarea
          value={observaciones}
          onChange={(e) => onObservacionesChange(e.target.value)}
          placeholder="Notas adicionales sobre la entrega..."
          rows={2}
          className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,229,255,0.2)] focus:outline-none transition-all resize-none"
        />
      </div>
    </div>
  )
}
