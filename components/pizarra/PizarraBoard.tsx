// components/pizarra/PizarraBoard.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRealtimePizarra } from '@/hooks/useRealtimePizarra'
import PizarraCard from './PizarraCard'

export default function PizarraBoard() {
  const { groupedByStatus, isLoading } = useRealtimePizarra()
  const [columns, setColumns] = useState<any[]>([])
  const [isCoordinationOpen, setIsCoordinationOpen] = useState(false)

  // Load workflow states for the columns
  useEffect(() => {
    fetch('/api/workflow/states')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Exclude terminal states (like "Entregado") from the kiosk board
          const activeStates = data.data.filter((s: any) => !s.is_terminal)
          setColumns(activeStates)
        }
      })
      .catch((err) => console.error('Error fetching states for columns:', err))
  }, [])

  if (isLoading || columns.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] gap-3">
        <span className="text-neon-blue animate-pulse font-mono tracking-widest text-sm uppercase">
          Inicializando Conexión Satelital de Pizarra...
        </span>
      </div>
    )
  }

  const orderedDiagNames = ['En espera de diagnóstico', 'En diagnóstico', 'Coordinación con el cliente', 'En espera de repuesto']
  const orderedServNames = ['Aprobado', 'En mantenimiento', 'En espera de repuesto adicional']

  const diagCols = orderedDiagNames
    .map(name => columns.find(c => c.name.trim().toUpperCase() === name.toUpperCase()))
    .filter(Boolean)
    .filter(col => {
      // "En espera de repuesto" solo se muestra si tiene equipos
      if (col.name === 'En espera de repuesto') {
        return (groupedByStatus[col.name]?.length || 0) > 0
      }
      // "Coordinación con el cliente" solo se muestra si tiene equipos
      if (col.name === 'Coordinación con el cliente') {
        return (groupedByStatus[col.name]?.length || 0) > 0
      }
      return true
    }) as any[]

  const servCols = orderedServNames
    .map(name => columns.find(c => c.name.trim().toUpperCase() === name.toUpperCase()))
    .filter(Boolean)
    .filter(col => {
      if (col.name === 'En espera de repuesto adicional') {
        return (groupedByStatus[col.name]?.length || 0) > 0
      }
      return true
    }) as any[]

  return (
    <div className="space-y-6 h-[calc(100vh-200px)] flex flex-col min-w-full">
      {/* Sección Diagnósticos */}
      <div className="flex-1 flex flex-col min-h-0 glass-card rounded-2xl p-4 shadow-glass relative overflow-hidden">
        {/* Cabecera estilo panel Linux / Window header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08] select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>
            <div className="h-3.5 w-px bg-white/10 mx-1" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-text-forge flex items-center gap-2">
              <span className="text-amber-glow">#</span> Módulo de Diagnósticos
            </h2>
          </div>
          <span className="text-[10px] font-mono text-text-forge-dim bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded">
            WS: active
          </span>
        </div>
        
        <div className="flex-1 flex gap-4 overflow-x-auto pb-2 scrollbar-thin items-start pr-12">
          {diagCols.filter(col => col.name !== 'Coordinación con el cliente').map((col: any) => {
            const equipmentsInCol = groupedByStatus[col.name] || []
            return (
              <div
                key={col.id}
                className="flex-1 min-w-[280px] glass-card rounded-xl p-3.5 flex flex-col max-h-full hover:glass-card-hover transition-all duration-300"
              >
                {/* Column Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-white/[0.08] mb-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-forge flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: col.color, boxShadow: `0 0 10px ${col.color}` }}
                    />
                    {col.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-amber-core/10 border border-amber-core/25 text-amber-glow px-2 py-0.5 rounded-md shadow-sm">
                    {equipmentsInCol.length}
                  </span>
                </div>

                {/* Cards Area */}
                <div className="space-y-1 overflow-y-auto flex-1 pr-1 scrollbar-thin min-h-[80px]">
                  {equipmentsInCol.length === 0 ? (
                    <div className="text-center py-6 text-[10px] text-text-forge-dim italic">
                      Sin equipos
                    </div>
                  ) : (
                    equipmentsInCol.map((eq: any) => (
                      <PizarraCard key={eq.id} equipment={eq} />
                    ))
                  )}
                </div>
              </div>
            )
          })}

          {/* Caso especial: Coordinación con el cliente (Pestaña Flotante Horizontal -> Columna Derecha) */}
          {diagCols.find(c => c.name === 'Coordinación con el cliente') && (
            (() => {
              const col = diagCols.find(c => c.name === 'Coordinación con el cliente')!
              const equipmentsInCol = groupedByStatus[col.name] || []
              const coordinationColor = '#818CF8' // Indigo suave, no emergencia
              
              return (
                <div
                  key={col.id}
                  className={`flex flex-col border transition-all duration-500 ease-in-out shadow-2xl rounded-xl ${
                    isCoordinationOpen 
                      ? 'min-w-[300px] flex-1 glass-card border-indigo-500/50' 
                      : 'w-max h-10 glass-card border-indigo-500/30 absolute right-4 bottom-4 z-20'
                  }`}
                >
                  <button
                    onClick={() => setIsCoordinationOpen(!isCoordinationOpen)}
                    className={`flex items-center gap-3 outline-none group transition-all ${
                      !isCoordinationOpen 
                        ? 'px-4 h-full hover:bg-white/5' 
                        : 'p-3 border-b border-border-subtle/60'
                    }`}
                  >
                    {isCoordinationOpen ? (
                      <>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#818CF8]" />
                          {col.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/40 text-indigo-400 px-2 py-0.5 rounded-full">
                            {equipmentsInCol.length}
                          </span>
                          <span className="text-indigo-400 text-xs animate-pulse">❮</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#818CF8] animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                          {col.name}
                        </span>
                        <div className="flex items-center gap-2 border-l border-indigo-500/30 pl-3 ml-1">
                          <span className="text-[10px] font-mono font-bold text-indigo-400">
                            {equipmentsInCol.length}
                          </span>
                          <span className="text-indigo-400 text-xs group-hover:translate-x-1 transition-transform">❯</span>
                        </div>
                      </>
                    )}
                  </button>

                  {isCoordinationOpen && (
                    <div className="p-4 space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin animate-in fade-in slide-in-from-right-4 duration-300">
                      {equipmentsInCol.map((eq: any) => (
                        <PizarraCard key={eq.id} equipment={eq} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })()
          )}
        </div>
      </div>

      {/* Sección Servicio */}
      <div className="flex-1 flex flex-col min-h-0 glass-card rounded-2xl p-4 shadow-glass relative overflow-hidden">
        {/* Cabecera estilo panel Linux / Window header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08] select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500/80 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500/80 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>
            <div className="h-3.5 w-px bg-white/10 mx-1" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-text-forge flex items-center gap-2">
              <span className="text-sky-400">#</span> Servicio de Taller (Mantenimiento)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-text-forge-dim bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded">
            Live Feed
          </span>
        </div>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-2 scrollbar-thin items-start">
          {servCols.map((col: any) => {
            const equipmentsInCol = groupedByStatus[col.name] || []
            return (
              <div
                key={col.id}
                className="flex-1 min-w-[280px] glass-card rounded-xl p-3.5 flex flex-col max-h-full hover:glass-card-hover transition-all duration-300"
              >
                {/* Column Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-white/[0.08] mb-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-text-forge flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: col.color, boxShadow: `0 0 10px ${col.color}` }}
                    />
                    {col.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-white/[0.05] border border-white/10 text-text-forge px-2 py-0.5 rounded-md shadow-sm">
                    {equipmentsInCol.length}
                  </span>
                </div>

                {/* Cards Area */}
                <div className="space-y-1 overflow-y-auto flex-1 pr-1 scrollbar-thin min-h-[80px]">
                  {equipmentsInCol.length === 0 ? (
                    <div className="text-center py-6 text-[10px] text-text-forge-dim italic">
                      Sin equipos
                    </div>
                  ) : (
                    equipmentsInCol.map((eq: any) => (
                      <PizarraCard key={eq.id} equipment={eq} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
