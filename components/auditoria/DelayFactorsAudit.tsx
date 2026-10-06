// components/auditoria/DelayFactorsAudit.tsx
'use client'

import React, { useState } from 'react'
import { DelayFactor } from '@/lib/stats/model-forecast'
import {
  AlertTriangle,
  Package,
  Wrench,
  Users,
  CheckCircle,
  FileText,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface DelayFactorsAuditProps {
  delayFactors: DelayFactor[]
  recentHistory?: Array<{
    role: string
    transition: string
    note: string
    is_override: boolean
    date: string
  }>
}

export function DelayFactorsAudit({
  delayFactors,
  recentHistory = [],
}: DelayFactorsAuditProps) {
  const [showAllNotes, setShowAllNotes] = useState(false)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'REPUESTOS_LOGISTICA':
        return <Package size={14} className="text-amber-400" />
      case 'COMPLEJIDAD_TECNICA':
        return <Wrench size={14} className="text-red-400" />
      case 'CLIENTE_APROBACION':
        return <Users size={14} className="text-neon-purple" />
      case 'CALIDAD_PRUEBAS':
        return <CheckCircle size={14} className="text-sky-400" />
      default:
        return <AlertTriangle size={14} className="text-neon-blue" />
    }
  }

  const getImpactBadge = (impact: 'ALTO' | 'MEDIO' | 'LEVE') => {
    switch (impact) {
      case 'ALTO':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
            IMPACTO ALTO
          </span>
        )
      case 'MEDIO':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            IMPACTO MEDIO
          </span>
        )
      case 'LEVE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            IMPACTO LEVE
          </span>
        )
    }
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div>
          <h3 className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={15} className="text-amber-400" /> Auditoría de Factores de Retraso y Cuellos de Botella
          </h3>
          <p className="text-[11px] text-text-muted mt-0.5">
            Patrones detectados automáticamente a partir de observaciones y notas de roles en taller
          </p>
        </div>
        <span className="text-[11px] text-text-secondary font-mono">
          {delayFactors.length} factores identificados
        </span>
      </div>

      {/* Factores Agrupados por Text Mining */}
      {delayFactors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {delayFactors.map((factor, idx) => (
            <div
              key={idx}
              className="bg-bg-elevated/40 border border-border-subtle rounded-lg p-4 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-white/5">
                      {getCategoryIcon(factor.category)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">
                        {factor.category_label}
                      </h4>
                      <span className="text-[10px] text-text-muted font-mono uppercase">
                        Área: {factor.role} ({factor.frequency} incidencias)
                      </span>
                    </div>
                  </div>
                  {getImpactBadge(factor.impact)}
                </div>

                {/* Palabras Clave Frecuentes */}
                {factor.common_terms.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1 items-center">
                    <Tag size={10} className="text-text-muted mr-1" />
                    {factor.common_terms.map((term, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/5 border border-border-subtle text-text-secondary"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                )}

                {/* Notas de Muestra */}
                {factor.sample_notes.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[10px] text-text-muted font-semibold uppercase block">
                      Observaciones de muestra:
                    </span>
                    {factor.sample_notes.map((note, nIdx) => (
                      <p
                        key={nIdx}
                        className="text-[11px] text-text-primary/90 italic bg-bg-surface/60 p-2 rounded border border-border-subtle/50 leading-relaxed border-l-2 border-amber-400"
                      >
                        &quot;{note}&quot;
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-text-muted text-xs bg-bg-elevated/20 rounded-lg border border-dashed border-border-subtle">
          No se han registrado factores críticos de demora recurrentes para este modelo.
        </div>
      )}

      {/* Historial Detallado de Notas de Transiciones */}
      {recentHistory.length > 0 && (
        <div className="pt-3 border-t border-border-subtle space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={13} className="text-neon-blue" /> Bitácora de Observaciones Registradas ({recentHistory.length})
            </span>
            <button
              type="button"
              onClick={() => setShowAllNotes(!showAllNotes)}
              className="text-[11px] text-neon-blue hover:underline flex items-center gap-1 font-mono"
            >
              {showAllNotes ? (
                <>
                  Ver menos <ChevronUp size={12} />
                </>
              ) : (
                <>
                  Ver todas <ChevronDown size={12} />
                </>
              )}
            </button>
          </div>

          <div
            className={`space-y-2 overflow-y-auto scrollbar-thin pr-1 transition-all ${
              showAllNotes ? 'max-h-[360px]' : 'max-h-[180px]'
            }`}
          >
            {recentHistory.map((h, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-bg-elevated/30 rounded-lg border border-border-subtle/60 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 rounded bg-bg-surface border border-border-subtle text-neon-blue font-bold uppercase">
                      {h.role}
                    </span>
                    {h.is_override && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold text-[9px]">
                        OVERRIDE
                      </span>
                    )}
                    <span className="text-text-muted font-mono">{h.transition}</span>
                  </div>
                  <span className="text-text-muted">
                    {new Date(h.date).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-text-primary/90 italic leading-relaxed pl-1 text-[11px]">
                  &quot;{h.note}&quot;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
