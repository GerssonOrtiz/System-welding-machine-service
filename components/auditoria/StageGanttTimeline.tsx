// components/auditoria/StageGanttTimeline.tsx
'use client'

import React from 'react'
import { ModelTimings } from '@/lib/stats/model-forecast'
import { GitCommit, ArrowRight } from 'lucide-react'

interface StageGanttTimelineProps {
  timings: ModelTimings
  includePartsWait?: boolean
}

export function StageGanttTimeline({
  timings,
  includePartsWait = true,
}: StageGanttTimelineProps) {
  const diag = Math.max(0.5, timings.diagnosis.median_days)
  const appr = Math.max(0.5, timings.approval.median_days)
  const parts = includePartsWait && timings.waiting_parts.occurred_in_pct > 25
    ? Math.max(0.5, timings.waiting_parts.median_days)
    : 0
  const maint = Math.max(0.5, timings.maintenance.median_days)
  const quality = 1.0 // 1 día estándar de pruebas y control de calidad

  const sumDays = diag + appr + parts + maint + quality

  const diagPct = Math.round((diag / sumDays) * 100)
  const apprPct = Math.round((appr / sumDays) * 100)
  const partsPct = parts > 0 ? Math.round((parts / sumDays) * 100) : 0
  const maintPct = Math.round((maint / sumDays) * 100)
  const qualityPct = 100 - (diagPct + apprPct + partsPct + maintPct)

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div>
          <h3 className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
            <GitCommit size={15} /> Flujo Típico de Atención (Gantt Proporcional)
          </h3>
          <p className="text-[11px] text-text-muted mt-0.5">
            Distribución proporcional del ciclo de vida del servicio en taller
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-text-secondary font-mono">
            Ciclo estimado: <strong className="text-neon-blue font-bold">~{Math.round(sumDays * 10) / 10} días</strong>
          </span>
        </div>
      </div>

      {/* Barra segmentada estilo Gantt */}
      <div className="space-y-2">
        <div className="w-full h-8 bg-bg-elevated rounded-lg overflow-hidden flex border border-border-subtle shadow-inner">
          {/* Diagnóstico */}
          <div
            style={{ width: `${diagPct}%` }}
            className="bg-neon-blue/80 hover:bg-neon-blue transition-colors flex items-center justify-center text-bg-base font-bold text-[11px] font-mono cursor-pointer relative group"
            title={`Diagnóstico: ${diag} días (${diagPct}%)`}
          >
            <span className="truncate px-1">Diag ({diag}d)</span>
          </div>

          {/* Aprobación */}
          <div
            style={{ width: `${apprPct}%` }}
            className="bg-neon-purple/80 hover:bg-neon-purple transition-colors flex items-center justify-center text-white font-bold text-[11px] font-mono cursor-pointer relative group"
            title={`Aprobación: ${appr} días (${apprPct}%)`}
          >
            <span className="truncate px-1">Aprob ({appr}d)</span>
          </div>

          {/* Espera de repuesto */}
          {parts > 0 && (
            <div
              style={{ width: `${partsPct}%` }}
              className="bg-amber-500/80 hover:bg-amber-500 transition-colors flex items-center justify-center text-bg-base font-bold text-[11px] font-mono cursor-pointer relative group"
              title={`Espera de repuestos: ${parts} días (${partsPct}%)`}
            >
              <span className="truncate px-1">Repuesto ({parts}d)</span>
            </div>
          )}

          {/* Mantenimiento */}
          <div
            style={{ width: `${maintPct}%` }}
            className="bg-emerald-500/80 hover:bg-emerald-500 transition-colors flex items-center justify-center text-bg-base font-bold text-[11px] font-mono cursor-pointer relative group"
            title={`Mantenimiento: ${maint} días (${maintPct}%)`}
          >
            <span className="truncate px-1">Taller ({maint}d)</span>
          </div>

          {/* Calidad y Entrega */}
          <div
            style={{ width: `${Math.max(5, qualityPct)}%` }}
            className="bg-sky-400/80 hover:bg-sky-400 transition-colors flex items-center justify-center text-bg-base font-bold text-[11px] font-mono cursor-pointer relative group"
            title={`Control de calidad y entrega: ${quality} día (${qualityPct}%)`}
          >
            <span className="truncate px-1">CC ({quality}d)</span>
          </div>
        </div>

        {/* Leyenda y secuencia */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-text-secondary border-t border-border-subtle/50">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-neon-blue" />
            <span>Diagnóstico (~{diag}d)</span>
          </div>

          <ArrowRight size={12} className="text-text-muted hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-neon-purple" />
            <span>Aprobación (~{appr}d)</span>
          </div>

          {parts > 0 && (
            <>
              <ArrowRight size={12} className="text-text-muted hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>Logística Repuestos (~{parts}d)</span>
              </div>
            </>
          )}

          <ArrowRight size={12} className="text-text-muted hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span>Mantenimiento (~{maint}d)</span>
          </div>

          <ArrowRight size={12} className="text-text-muted hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
            <span>Control de Calidad (~{quality}d)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
