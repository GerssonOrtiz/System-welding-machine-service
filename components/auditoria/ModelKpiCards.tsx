// components/auditoria/ModelKpiCards.tsx
'use client'

import React from 'react'
import { ModelTimings } from '@/lib/stats/model-forecast'
import { Clock, CheckCircle2, AlertTriangle, Wrench, Layers } from 'lucide-react'

interface ModelKpiCardsProps {
  timings: ModelTimings
  brand: string
  modelName: string
}

export function ModelKpiCards({ timings, brand, modelName }: ModelKpiCardsProps) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <h3 className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={15} /> Métricas Clave de Rendimiento ({brand} {modelName})
        </h3>
        <span className="text-[11px] text-text-muted font-mono">
          Valores en días hábiles / calendario
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Diagnóstico */}
        <div className="bg-bg-elevated/60 p-3.5 rounded-lg border border-border-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-neon-blue mb-1">
              <span className="text-[11px] uppercase font-bold tracking-wider">Diagnóstico</span>
              <Layers size={14} />
            </div>
            <div className="text-2xl font-mono font-bold text-text-primary">
              {timings.diagnosis.median_days}
              <span className="text-xs font-normal text-text-muted ml-1">días</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border-subtle/50 text-[10px] text-text-muted space-y-0.5">
            <div className="flex justify-between">
              <span>Promedio:</span>
              <strong className="text-text-secondary font-mono">{timings.diagnosis.avg_days}d</strong>
            </div>
            <div className="flex justify-between">
              <span>Rango (p20-p80):</span>
              <span className="text-neon-blue font-mono">
                {timings.diagnosis.optimistic_days}d - {timings.diagnosis.pessimistic_days}d
              </span>
            </div>
          </div>
        </div>

        {/* Aprobación Comercial */}
        <div className="bg-bg-elevated/60 p-3.5 rounded-lg border border-border-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-neon-purple mb-1">
              <span className="text-[11px] uppercase font-bold tracking-wider">Aprobación</span>
              <CheckCircle2 size={14} />
            </div>
            <div className="text-2xl font-mono font-bold text-text-primary">
              {timings.approval.median_days}
              <span className="text-xs font-normal text-text-muted ml-1">días</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border-subtle/50 text-[10px] text-text-muted space-y-0.5">
            <div className="flex justify-between">
              <span>Promedio:</span>
              <strong className="text-text-secondary font-mono">{timings.approval.avg_days}d</strong>
            </div>
            <div className="flex justify-between">
              <span>Rango (p20-p80):</span>
              <span className="text-neon-purple font-mono">
                {timings.approval.optimistic_days}d - {timings.approval.pessimistic_days}d
              </span>
            </div>
          </div>
        </div>

        {/* Espera de Repuestos */}
        <div className="bg-bg-elevated/60 p-3.5 rounded-lg border border-border-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-[11px] uppercase font-bold tracking-wider">Espera Repuesto</span>
              <AlertTriangle size={14} />
            </div>
            <div className="text-2xl font-mono font-bold text-text-primary">
              {timings.waiting_parts.median_days}
              <span className="text-xs font-normal text-text-muted ml-1">días</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border-subtle/50 text-[10px] text-text-muted space-y-0.5">
            <div className="flex justify-between">
              <span>Ocurrencia:</span>
              <strong className="text-amber-400 font-mono">{timings.waiting_parts.occurred_in_pct}%</strong>
            </div>
            <div className="flex justify-between">
              <span>Promedio:</span>
              <span className="text-text-secondary font-mono">{timings.waiting_parts.avg_days}d</span>
            </div>
          </div>
        </div>

        {/* Mantenimiento Activo */}
        <div className="bg-bg-elevated/60 p-3.5 rounded-lg border border-border-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-[11px] uppercase font-bold tracking-wider">Mantenimiento</span>
              <Wrench size={14} />
            </div>
            <div className="text-2xl font-mono font-bold text-text-primary">
              {timings.maintenance.median_days}
              <span className="text-xs font-normal text-text-muted ml-1">días</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border-subtle/50 text-[10px] text-text-muted space-y-0.5">
            <div className="flex justify-between">
              <span>Promedio:</span>
              <strong className="text-text-secondary font-mono">{timings.maintenance.avg_days}d</strong>
            </div>
            <div className="flex justify-between">
              <span>Rango (p20-p80):</span>
              <span className="text-emerald-400 font-mono">
                {timings.maintenance.optimistic_days}d - {timings.maintenance.pessimistic_days}d
              </span>
            </div>
          </div>
        </div>

        {/* Lead Time Total */}
        <div className="col-span-2 md:col-span-1 bg-neon-blue/5 p-3.5 rounded-lg border border-neon-blue/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-neon-blue mb-1">
              <span className="text-[11px] uppercase font-bold tracking-wider">Lead Time Total</span>
              <Clock size={14} />
            </div>
            <div className="text-2xl font-mono font-bold text-neon-blue">
              {timings.total_lead_time.median_days}
              <span className="text-xs font-normal text-neon-blue/70 ml-1">días</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-neon-blue/20 text-[10px] text-text-muted space-y-0.5">
            <div className="flex justify-between">
              <span>Promedio:</span>
              <strong className="text-text-secondary font-mono">{timings.total_lead_time.avg_days}d</strong>
            </div>
            <div className="flex justify-between">
              <span>Mejor / Peor:</span>
              <span className="text-neon-blue font-mono">
                {timings.total_lead_time.best_case_days}d / {timings.total_lead_time.worst_case_days}d
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
