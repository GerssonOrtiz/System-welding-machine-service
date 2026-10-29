// components/equipment/modals/ModalAprobacionVentas.tsx
'use client'

import React from 'react'
import { CheckSquare, Plus, Trash2, Package, Wrench } from 'lucide-react'

export interface VentasItem {
  descripcion: string
  cantidad: string
  precio?: string
  fecha_llegada?: string
  tipo?: 'REPUESTO' | 'SERVICIO'
}

interface ModalAprobacionVentasProps {
  items: VentasItem[]
  onItemsChange: (items: VentasItem[]) => void
  observaciones: string
  onObservacionesChange: (v: string) => void
}

const SERVICIOS_HABITUALES = [
  'Pintado de tapa',
  'Servicio de mantenimiento',
  'Informe de servicio',
  'Certificado de VRD',
  'Reparación de tarjeta',
  'Reparación general',
]

export default function ModalAprobacionVentas({
  items,
  onItemsChange,
  observaciones,
  onObservacionesChange,
}: ModalAprobacionVentasProps) {
  // Manejo de repuestos
  const addRepuesto = () => {
    onItemsChange([
      ...items,
      { descripcion: '', cantidad: '1', fecha_llegada: '', tipo: 'REPUESTO' },
    ])
  }

  // Manejo de servicios
  const addServicio = (nombreServicio: string = '') => {
    onItemsChange([
      ...items,
      { descripcion: nombreServicio, cantidad: '1', tipo: 'SERVICIO' },
    ])
  }

  const removeItem = (globalIndex: number) => {
    onItemsChange(items.filter((_, i) => i !== globalIndex))
  }

  const updateItem = (globalIndex: number, field: keyof VentasItem, value: string) => {
    const updated = items.map((item, i) =>
      i === globalIndex ? { ...item, [field]: value } : item
    )
    onItemsChange(updated)
  }

  // Separar índices por tipo para poder editar y eliminar con el índice real
  const repuestosWithIdx = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => (item.tipo || 'REPUESTO') === 'REPUESTO')

  const serviciosWithIdx = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.tipo === 'SERVICIO')

  return (
    <div className="space-y-5 pt-3 border-t border-neon-blue/20">
      <p className="text-[10px] font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
        <CheckSquare size={12} /> Aprobación de Presupuesto y Servicio — Correo Ventas
      </p>

      {/* ── SECCIÓN 1: REPUESTOS APROBADOS ── */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
            <Package size={13} /> 1. Repuestos Aprobados
          </label>
          <span className="text-[10px] text-text-muted">
            {repuestosWithIdx.length} {repuestosWithIdx.length === 1 ? 'ítem' : 'ítems'}
          </span>
        </div>

        {repuestosWithIdx.length === 0 ? (
          <p className="text-xs text-text-muted italic py-1">No se han añadido repuestos.</p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[1fr_70px_130px_32px] gap-1.5 px-1">
              <span className="text-[9px] font-bold text-text-muted uppercase">Descripción del Repuesto</span>
              <span className="text-[9px] font-bold text-text-muted uppercase text-center">Cant.</span>
              <span className="text-[9px] font-bold text-text-muted uppercase text-center">Fecha Llegada</span>
              <span />
            </div>

            {/* Filas */}
            {repuestosWithIdx.map(({ item, index }) => (
              <div key={index} className="grid grid-cols-[1fr_70px_130px_32px] gap-1.5 items-center">
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                  placeholder="Ej: Juego de Carbones / Tarjeta de Control"
                  className="bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:outline-none transition-all"
                />
                <input
                  type="text"
                  value={item.cantidad}
                  onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                  placeholder="1"
                  className="bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary text-center focus:border-neon-blue focus:outline-none transition-all"
                />
                <input
                  type="date"
                  value={item.fecha_llegada || ''}
                  onChange={(e) => updateItem(index, 'fecha_llegada', e.target.value)}
                  className="bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary text-center focus:border-neon-blue focus:outline-none transition-all"
                  title="Fecha de llegada estimada"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="flex items-center justify-center text-text-muted hover:text-red-400 transition-colors"
                  title="Eliminar repuesto"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addRepuesto}
          className="flex items-center gap-1.5 text-[10px] text-neon-blue hover:text-neon-blue/80 font-semibold transition-colors mt-1"
        >
          <Plus size={12} /> Agregar repuesto
        </button>
      </div>

      {/* ── SECCIÓN 2: SERVICIOS APROBADOS ── */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neon-purple uppercase tracking-wider flex items-center gap-1.5">
            <Wrench size={13} /> 2. Servicios Aprobados
          </label>
          <span className="text-[10px] text-text-muted">
            {serviciosWithIdx.length} {serviciosWithIdx.length === 1 ? 'servicio' : 'servicios'}
          </span>
        </div>

        {/* Sugerencias rápidas habituales */}
        <div className="space-y-1">
          <span className="text-[10px] text-text-muted font-semibold uppercase">Sugerencias habituales:</span>
          <div className="flex flex-wrap gap-1.5">
            {SERVICIOS_HABITUALES.map((serv) => (
              <button
                key={serv}
                type="button"
                onClick={() => addServicio(serv)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/20 transition-all font-medium flex items-center gap-1"
              >
                <Plus size={10} /> {serv}
              </button>
            ))}
          </div>
        </div>

        {serviciosWithIdx.length === 0 ? (
          <p className="text-xs text-text-muted italic py-1">No se han añadido servicios específicos.</p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_32px] gap-1.5 px-1">
              <span className="text-[9px] font-bold text-text-muted uppercase">Descripción del Servicio</span>
              <span className="text-[9px] font-bold text-text-muted uppercase text-center">Cant.</span>
              <span />
            </div>

            {/* Filas */}
            {serviciosWithIdx.map(({ item, index }) => (
              <div key={index} className="grid grid-cols-[1fr_80px_32px] gap-1.5 items-center">
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                  placeholder="Ej: Pintado de tapa / Servicio de mantenimiento"
                  className="bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-neon-purple focus:outline-none transition-all"
                />
                <input
                  type="text"
                  value={item.cantidad}
                  onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                  placeholder="1"
                  className="bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 text-xs text-text-primary text-center focus:border-neon-purple focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="flex items-center justify-center text-text-muted hover:text-red-400 transition-colors"
                  title="Eliminar servicio"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => addServicio('')}
          className="flex items-center gap-1.5 text-[10px] text-neon-purple hover:text-neon-purple/80 font-semibold transition-colors mt-1"
        >
          <Plus size={12} /> Agregar otro servicio
        </button>
      </div>

      {/* Observaciones */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Observaciones
        </label>
        <textarea
          value={observaciones}
          onChange={(e) => onObservacionesChange(e.target.value)}
          placeholder="Notas adicionales sobre la aprobación de repuestos o servicios..."
          rows={2}
          className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,229,255,0.2)] focus:outline-none transition-all resize-none"
        />
      </div>
    </div>
  )
}
