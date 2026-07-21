// components/pizarra/PizarraCard.tsx
'use client'

import React, { useState } from 'react'
import EquipmentDetail from '@/components/equipment/EquipmentDetail'

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
  }
}

export default function PizarraCard({ equipment }: PizarraCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const priorityLevel = equipment.priority_level || (equipment.is_priority ? 1 : 0)
  const isPriority = priorityLevel > 0

  const cardClasses = `bg-bg-surface/60 border rounded-lg px-3 py-2 flex items-center gap-3 transition-all duration-150 group cursor-pointer shadow-sm mb-1.5 ${
    priorityLevel === 3
      ? 'border-neon-purple shadow-[0_0_15px_rgba(157,78,221,0.4)] hover:bg-neon-purple/10 animate-glow-pulse' 
      : priorityLevel === 2
      ? 'border-neon-purple/70 shadow-[0_0_10px_rgba(157,78,221,0.2)] hover:bg-neon-purple/5'
      : priorityLevel === 1
      ? 'border-neon-purple/40 hover:bg-neon-purple/5'
      : 'border-border-subtle hover:bg-bg-surface hover:border-neon-blue/40'
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
          style={{ backgroundColor: equipment.status_color || '#00E5FF', boxShadow: `0 0 8px ${equipment.status_color}40` }}
        />
        
        {/* FR y Cliente - Información Primaria */}
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <div className="flex flex-col items-start shrink-0 w-16">
            <span className="font-mono text-sm font-bold text-neon-blue uppercase tracking-wider">
              {equipment.fr_number.replace('FR-', '')}
            </span>
            {isPriority && (
              <span className={`text-[8px] font-black text-neon-purple leading-none mt-0.5 ${priorityLevel === 3 ? 'animate-pulse' : ''}`}>
                {priorityStars()} VIP {priorityLevel}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-text-primary truncate block uppercase leading-none mb-0.5">
              {equipment.client_name}
            </span>
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[9px] text-text-muted truncate shrink-0 uppercase tracking-tight">
                {equipment.brand} {equipment.model}
              </span>
              {equipment.assigned_technicians && equipment.assigned_technicians.length > 0 && (
                <div className="flex items-center gap-1 overflow-hidden">
                  <span className="text-[8px] text-text-muted">•</span>
                  <div className="flex gap-1 overflow-hidden">
                    {equipment.assigned_technicians.map((tech, idx) => (
                      <span key={idx} className="text-[8px] font-bold text-neon-blue/80 bg-neon-blue/5 px-1 rounded border border-neon-blue/10 whitespace-nowrap">
                        {tech.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
