// app/(dashboard)/taller/page.tsx
'use client'

import React, { useState } from 'react'
import { useEquipmentList } from '@/hooks/useEquipmentList'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useRealtimePizarra } from '@/hooks/useRealtimePizarra'
import StatusBadge from '@/components/equipment/StatusBadge'
import EquipmentDetail from '@/components/equipment/EquipmentDetail'
import { Wrench, Search, Clock, ShieldCheck, ChevronRight, Sparkles, AlertTriangle, Layers, UserCheck } from 'lucide-react'

export default function TallerPage() {
  usePageTitle('Centro de Servicios')
  const { equipments, isLoading, mutate } = useEquipmentList(0, false)
  const [selectedEq, setSelectedEq] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Sincronización en tiempo real
  useRealtimePizarra(mutate)

  // Filtrado de columnas por etapas operativas
  const col1States = ['En espera de diagnóstico', 'En diagnóstico']
  const col2States = [
    'Aprobado',
    'En mantenimiento',
    'En espera de repuesto adicional',
  ]

  const filteredEquipments = equipments.filter((eq: any) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return (
      eq.fr_number?.toLowerCase().includes(term) ||
      eq.serial_number?.toLowerCase().includes(term) ||
      eq.brand?.toLowerCase().includes(term) ||
      eq.model?.toLowerCase().includes(term) ||
      eq.client_name?.toLowerCase().includes(term)
    )
  })

  const column1Equipments = filteredEquipments.filter((eq: any) => col1States.includes(eq.status_name))
  const column2Equipments = filteredEquipments.filter((eq: any) => col2States.includes(eq.status_name))

  const handleOpenDetail = (eq: any) => {
    setSelectedEq(eq)
    setIsDetailOpen(true)
  }

  const renderCard = (eq: any) => {
    const isDelayed = eq.days_elapsed > 5
    const priorityLevel = eq.priority_level || (eq.is_priority ? 1 : 0)

    return (
      <div
        key={eq.id}
        onClick={() => handleOpenDetail(eq)}
        className="group relative rounded-2xl p-4 cursor-pointer transition-all duration-300 border backdrop-blur-xl bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-cyan-500/40 shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_32px_rgba(0,210,255,0.15)] hover:scale-[1.01]"
      >
        {/* Glow dinámico al pasar el cursor */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Cabecera de la Tarjeta */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-lg tracking-wider">
                {eq.fr_number}
              </span>
              {priorityLevel > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                  <Sparkles size={11} className="text-amber-400 animate-pulse" />
                  VIP {priorityLevel}
                </span>
              )}
            </div>

            <StatusBadge status={eq.status_name} color={eq.status_color} />
          </div>

          {/* Información Principal del Equipo */}
          <div>
            <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors uppercase tracking-tight flex items-center justify-between">
              <span>{eq.brand} <strong className="text-white font-bold">{eq.model}</strong></span>
              <ChevronRight size={14} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">
              {eq.client_name || 'Sin cliente especificado'}
            </p>
          </div>

          {/* Datos Secundarios: Serie y Técnicos */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-white/[0.06] text-slate-400">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans">N° de Serie</span>
              <span className="text-slate-300 font-semibold">{eq.serial_number || 'S/N'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-sans">Responsables</span>
              <span className="text-slate-300 truncate block">
                {eq.assigned_technicians?.length > 0 ? eq.assigned_technicians.join(', ') : 'No asignado'}
              </span>
            </div>
          </div>

          {/* Pie de Tarjeta: Tiempo y Repuestos */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[11px]">
            <div className={`flex items-center gap-1.5 font-medium ${isDelayed ? 'text-rose-400' : 'text-slate-400'}`}>
              {isDelayed ? <AlertTriangle size={12} className="animate-pulse text-rose-400" /> : <Clock size={12} />}
              <span>{eq.days_elapsed} d en taller</span>
            </div>

            {/* Badge de Repuestos logísticos */}
            {eq.parts_status && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white/[0.05] border border-white/10 text-slate-300">
                {eq.parts_status === 'COMPLETO' ? '📦 Rep. Listos' : eq.parts_status === 'PARCIAL' ? '📦 Rep. Parcial' : '📦 Sin repuestos'}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans text-text-primary p-2 sm:p-4 md:p-6">
      {/* ── Header con Cyber Glassmorphism ── */}
      <div className="relative rounded-3xl p-6 md:p-8 border border-white/10 backdrop-blur-2xl bg-gradient-to-r from-bg-surface/85 via-bg-surface/65 to-bg-surface/85 shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Centro de Servicios Técnicos Integral</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              Operaciones de Servicio y Taller
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Gestión y seguimiento operativo en tiempo real de diagnósticos, mantenimientos preventivos y correctivos de equipos en planta.
            </p>
          </div>

          {/* Buscador Integrado Glass */}
          <div className="w-full md:w-80">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por FR, serie, marca o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 backdrop-blur-xl transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido de Columnas Kanban en Glassmorphism ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shadow-[0_0_20px_rgba(0,210,255,0.3)]" />
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-300 animate-pulse">
            Sincronizando estado operativo de los equipos...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[60vh]">
          {/* Columna 1: En Diagnóstico */}
          <div className="rounded-3xl p-5 sm:p-6 border border-white/10 backdrop-blur-xl bg-white/[0.02] shadow-[0_12px_32px_rgba(0,0,0,0.3)] space-y-4 flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <span>En Diagnóstico y Evaluación</span>
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {column1Equipments.length}
                  </span>
                </h2>
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {column1Equipments.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-500 italic">No hay equipos en fase de diagnóstico en este momento.</p>
                </div>
              ) : (
                column1Equipments.map(renderCard)
              )}
            </div>
          </div>

          {/* Columna 2: Aprobados / En Mantenimiento */}
          <div className="rounded-3xl p-5 sm:p-6 border border-white/10 backdrop-blur-xl bg-white/[0.02] shadow-[0_12px_32px_rgba(0,0,0,0.3)] space-y-4 flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <span>Aprobados y en Mantenimiento</span>
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {column2Equipments.length}
                  </span>
                </h2>
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
              {column2Equipments.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-500 italic">No hay equipos en mantenimiento o aprobados actualmente.</p>
                </div>
              ) : (
                column2Equipments.map(renderCard)
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Ficha Detallada del Equipo */}
      {selectedEq && (
        <EquipmentDetail
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setSelectedEq(null)
          }}
          equipmentId={selectedEq.id}
          onStatusUpdated={mutate}
        />
      )}
    </div>
  )
}
