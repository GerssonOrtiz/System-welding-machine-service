// components/auditoria/DeliveryForecastCalculator.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { ModelTimings, addBusinessDays } from '@/lib/stats/model-forecast'
import {
  Zap,
  Calendar,
  AlertTriangle,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react'

interface DeliveryForecastCalculatorProps {
  timings?: ModelTimings
  modelName: string
  brand: string
  sampleSize: number
}

export function DeliveryForecastCalculator({
  timings,
  modelName,
  brand,
  sampleSize,
}: DeliveryForecastCalculatorProps) {
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0])
  const [useBusinessDays, setUseBusinessDays] = useState(true)
  const [isPriorityVip, setIsPriorityVip] = useState(false)
  const [hasSparePartRisk, setHasSparePartRisk] = useState(false)

  // Auto-activar alerta de repuestos si estadísticamente supera el 50%
  const partsOccurPct = timings?.waiting_parts.occurred_in_pct || 0
  const isHighPartsRisk = partsOccurPct >= 50

  useEffect(() => {
    if (isHighPartsRisk) {
      setHasSparePartRisk(true)
    }
  }, [isHighPartsRisk])

  // Lógica de cálculo del motor de pronóstico
  const calculateForecast = () => {
    const base = new Date(entryDate)
    if (isNaN(base.getTime())) return null

    const m = timings || {
      diagnosis: { median_days: 1.5, avg_days: 1.8, optimistic_days: 1.0, pessimistic_days: 3.0 },
      approval: { median_days: 2.0, avg_days: 2.2, optimistic_days: 1.0, pessimistic_days: 4.0 },
      waiting_parts: { occurred_in_pct: 0, avg_days: 4.0, median_days: 3.5 },
      maintenance: { median_days: 3.0, avg_days: 3.5, optimistic_days: 2.0, pessimistic_days: 5.5 },
      total_lead_time: { median_days: 7.5, avg_days: 8.5, best_case_days: 4.0, worst_case_days: 15.0 },
    }

    // Factor VIP: reduce un 20% los tiempos de espera
    const vipFactor = isPriorityVip ? 0.8 : 1.0

    const diagDays = Math.max(1, Math.round(m.diagnosis.median_days * vipFactor))
    const apprDays = Math.max(1, Math.round(m.approval.median_days * vipFactor))
    
    // Días extras por repuestos
    const extraPartsDays = hasSparePartRisk
      ? Math.max(2, Math.round((m.waiting_parts.median_days || 4) * vipFactor))
      : 0

    const maintDays = Math.max(1, Math.round(m.maintenance.median_days * vipFactor)) + extraPartsDays

    const addDays = (startDate: Date, days: number): Date => {
      if (useBusinessDays) {
        return addBusinessDays(startDate, days)
      } else {
        const d = new Date(startDate)
        d.setDate(d.getDate() + days)
        return d
      }
    }

    const diagDate = addDays(base, diagDays)
    const apprDate = addDays(diagDate, apprDays)
    const deliveryDate = addDays(apprDate, maintDays)

    const totalDays = diagDays + apprDays + maintDays

    const formatDate = (d: Date) =>
      d.toLocaleDateString('es-PE', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })

    return {
      diagDate: formatDate(diagDate),
      apprDate: formatDate(apprDate),
      deliveryDate: formatDate(deliveryDate),
      diagDays,
      apprDays,
      maintDays,
      extraPartsDays,
      totalDays,
    }
  }

  const forecast = calculateForecast()

  return (
    <div className="bg-bg-surface border border-neon-blue/30 rounded-xl p-5 shadow-neon-blue/5 space-y-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <span className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
            <Zap size={15} /> Calculadora de Entrega Predictiva
          </span>
          <span className="text-[11px] font-mono text-text-muted">
            {brand} {modelName}
          </span>
        </div>

        {/* Parámetros de simulación */}
        <div className="space-y-3.5 mt-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase block mb-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-neon-blue" /> Fecha de Ingreso del Equipo
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs focus:border-neon-blue focus:outline-none text-text-primary h-[38px]"
            />
          </div>

          <div className="p-3 bg-bg-elevated/40 rounded-lg border border-border-subtle space-y-2.5 text-xs">
            {/* Opción de días hábiles */}
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Cálculo de calendario:</span>
              <button
                type="button"
                onClick={() => setUseBusinessDays(!useBusinessDays)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                  useBusinessDays
                    ? 'bg-neon-blue/15 border-neon-blue/30 text-neon-blue'
                    : 'bg-white/5 border-border-subtle text-text-muted'
                }`}
              >
                {useBusinessDays ? 'Días Hábiles (L-V)' : 'Días Calendario'}
              </button>
            </div>

            {/* Checkbox de riesgo de repuesto */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={hasSparePartRisk}
                onChange={(e) => setHasSparePartRisk(e.target.checked)}
                className="rounded border-border-subtle text-amber-500 focus:ring-0 bg-bg-surface mt-0.5"
              />
              <div className="text-text-primary leading-tight">
                <span>Riesgo de espera de repuestos o importación</span>
                <span className="block text-[10px] text-amber-400 mt-0.5">
                  {isHighPartsRisk
                    ? `⚠️ Este modelo requiere repuestos en el ${partsOccurPct}% de sus ingresos (+${timings?.waiting_parts.median_days || 4}d estimadas)`
                    : '(+4 días estimados para compras/logística)'}
                </span>
              </div>
            </label>

            {/* Checkbox Prioridad VIP */}
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isPriorityVip}
                onChange={(e) => setIsPriorityVip(e.target.checked)}
                className="rounded border-border-subtle text-neon-purple focus:ring-0 bg-bg-surface"
              />
              <span className="text-text-primary flex items-center gap-1.5">
                <Star size={12} className="text-neon-purple fill-neon-purple" />
                Prioridad VIP ⭐ <strong className="text-neon-purple">(-20% tiempo en cola)</strong>
              </span>
            </label>
          </div>
        </div>

        {/* Cronograma Proyectado */}
        {forecast && (
          <div className="mt-5 space-y-3">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
              Cronograma Hito Proyectado
            </span>

            <div className="space-y-2 text-xs">
              {/* Diagnóstico */}
              <div className="flex items-center justify-between p-2.5 rounded bg-bg-elevated/60 border border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-blue" />
                  <span className="text-text-secondary">Término de Diagnóstico:</span>
                </div>
                <div className="text-right">
                  <strong className="text-neon-blue font-mono block">{forecast.diagDate}</strong>
                  <span className="text-[10px] text-text-muted">(~{forecast.diagDays} {useBusinessDays ? 'días hábiles' : 'días'})</span>
                </div>
              </div>

              {/* Aprobación */}
              <div className="flex items-center justify-between p-2.5 rounded bg-bg-elevated/60 border border-border-subtle">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-neon-purple" />
                  <span className="text-text-secondary">Aprobación Comercial:</span>
                </div>
                <div className="text-right">
                  <strong className="text-neon-purple font-mono block">{forecast.apprDate}</strong>
                  <span className="text-[10px] text-text-muted">(~{forecast.apprDays} {useBusinessDays ? 'días hábiles' : 'días'})</span>
                </div>
              </div>

              {/* Fecha final de entrega */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 shadow-sm">
                <div>
                  <span className="text-emerald-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Fecha Estimada de Entrega
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    Total: ~{forecast.totalDays} {useBusinessDays ? 'días hábiles' : 'días'} acumulados
                  </span>
                </div>
                <strong className="text-emerald-400 font-mono text-sm sm:text-base font-bold text-right">
                  {forecast.deliveryDate}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border-subtle/50 text-[10px] text-text-muted flex items-start gap-1.5 italic">
        <Info size={12} className="shrink-0 mt-0.5 text-neon-blue" />
        <span>
          Cálculo proyectado mediante medianas empíricas del modelo ({sampleSize} mantenimientos evaluados).
        </span>
      </div>
    </div>
  )
}
