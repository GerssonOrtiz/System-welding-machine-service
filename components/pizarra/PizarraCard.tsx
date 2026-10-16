// components/pizarra/PizarraCard.tsx
'use client'

import React, { useState } from 'react'
import { Package } from 'lucide-react'
import EquipmentDetail from '@/components/equipment/EquipmentDetail'
import type { PartsStatus } from '@/types/equipment'

interface PizarraCardProps {
  equipment: {
    id: string
    fr_number: string
    client_name: string
    brand: string
    model: string
    days_elapsed: number
    diagnosis_tech_username?: string | null
    maintenance_tech_username?: string | null
    status_color?: string
    assigned_technicians?: string[] | null
    priority_level?: number
    is_priority?: boolean // Maintain compatibility
    parts_status?: string | null
    approved_parts?: any[] | null
  }
}

export default function PizarraCard({ equipment }: PizarraCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const priorityLevel = equipment.priority_level || (equipment.is_priority ? 1 : 0)
  const isPriority = priorityLevel > 0

  const cardClasses = `glass-card border rounded-lg px-3 py-2 flex items-center gap-3 transition-standard group cursor-pointer shadow-glass mb-1.5 ${
    priorityLevel === 3
      ? 'border-amber-core/80 shadow-vip-amber hover:bg-amber-ghost/40 animate-amber-pulse' 
      : priorityLevel === 2
      ? 'border-amber-glow/70 shadow-amber-md hover:bg-amber-ghost/30'
      : priorityLevel === 1
      ? 'border-amber-border hover:bg-amber-ghost/20 shadow-amber-sm'
      : 'border-amber-border/20 hover:border-amber-border/50 hover:bg-amber-ghost/15'
  }`

  const priorityStars = () => {
    if (priorityLevel === 1) return '⭐'
    if (priorityLevel === 2) return '⭐⭐'
    if (priorityLevel === 3) return '⭐⭐⭐'
    return null
  }

  return (
    <>
      <div
        onClick={() => setIsDetailOpen(true)}
        className={cardClasses}
      >
        {/* Identificador FR - Color en base a estado para referencia rápida */}
        <div 
          className="w-1.5 h-6 rounded-full shrink-0" 
          style={{ backgroundColor: equipment.status_color || '#F59E0B', boxShadow: `0 0 8px ${equipment.status_color}50` }}
        />
        
        {/* FR y Cliente - Información Primaria */}
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <div className="flex flex-col items-start shrink-0 w-16">
            <span className="font-mono text-sm font-bold text-amber-glow uppercase tracking-wider">
              {equipment.fr_number.replace('FR-', '')}
            </span>
            {isPriority && (
              <span className={`text-[8px] font-black text-amber-core leading-none mt-0.5 ${priorityLevel === 3 ? 'animate-pulse' : ''}`}>
                {priorityStars()} VIP {priorityLevel}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-text-forge truncate block uppercase leading-none mb-0.5">
              {equipment.client_name}
            </span>
            <div className="flex items-center gap-2 overflow-hidden flex-wrap">
              <span className="text-[9px] text-text-forge-dim truncate shrink-0 uppercase tracking-tight">
                {equipment.brand} {equipment.model}
              </span>
              {equipment.assigned_technicians && equipment.assigned_technicians.length > 0 && (
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className="text-[8px] text-text-forge-dim">•</span>
                  <div className="flex gap-1 overflow-hidden">
                    {equipment.assigned_technicians.map((tech, idx) => (
                      <span key={idx} className="text-[8px] font-bold text-amber-glow bg-amber-ghost/40 px-1 rounded border border-amber-border/30 whitespace-nowrap">
                        {tech.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Chip de estado de repuestos — solo si hay approved_parts */}
              {equipment.approved_parts && equipment.approved_parts.length > 0 && (() => {
                const ps = (equipment.parts_status ?? 'SIN_REPUESTOS') as PartsStatus
                const chipConfig: Record<PartsStatus, { cls: string; icon: string }> = {
                  SIN_REPUESTOS: { cls: 'text-red-400/80 border-red-500/20 bg-red-500/5',    icon: '📦' },
                  PARCIAL:       { cls: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', icon: '📦' },
                  COMPLETO:      { cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', icon: '📦' },
                }
                const cfg = chipConfig[ps] ?? chipConfig['SIN_REPUESTOS']
                const label = ps === 'COMPLETO' ? 'Listo' : ps === 'PARCIAL' ? 'Parcial' : '—'
                if (ps === 'SIN_REPUESTOS') return (
                  <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1 rounded border ${cfg.cls}`}>
                    <Package size={7} /> Sin rep.
                  </span>
                )
                return (
                  <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1 rounded border ${cfg.cls}`}>
                    <Package size={7} /> {label}
                  </span>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Botón de información discreto */}
        <button 
          className="text-text-muted group-hover:text-neon-blue transition-colors p-1"
          onClick={(e) => {
            e.stopPropagation()
            setIsDetailOpen(true)
          }}
        >
          <span className="text-xs">ℹ️</span>
        </button>
      </div>

      {/* Modal de Detalle que se abre al hacer click */}
      {isDetailOpen && (
        <EquipmentDetail
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          equipmentId={equipment.id}
          // En la pizarra no solemos mutar directamente desde aquí, 
          // pero dejamos el soporte por si acaso
        />
      )}
    </>
  )
}
