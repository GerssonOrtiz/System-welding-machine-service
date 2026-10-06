// components/auditoria/ModelSelectorHeader.tsx
'use client'

import React from 'react'
import BrandSelector from '@/components/equipment/BrandSelector'
import ModelSelector from '@/components/equipment/ModelSelector'
import { ModelSummaryData } from '@/lib/stats/model-forecast'
import { Search, Filter, ShieldCheck, AlertCircle, Info } from 'lucide-react'

interface ModelSelectorHeaderProps {
  selectedBrand: string
  selectedModel: string
  selectedServiceType: string
  onBrandChange: (brand: string) => void
  onModelChange: (model: string) => void
  onServiceTypeChange: (serviceType: string) => void
  topModels: ModelSummaryData[]
  confidenceLevel?: 'ALTA' | 'MEDIA' | 'BAJA'
  sampleSize?: number
}

export function ModelSelectorHeader({
  selectedBrand,
  selectedModel,
  selectedServiceType,
  onBrandChange,
  onModelChange,
  onServiceTypeChange,
  topModels,
  confidenceLevel,
  sampleSize,
}: ModelSelectorHeaderProps) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <h2 className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-2">
          <Search size={14} /> Filtros de Auditoría y Modelo
        </h2>

        {selectedModel && confidenceLevel && sampleSize !== undefined && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                confidenceLevel === 'ALTA'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : confidenceLevel === 'MEDIA'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}
            >
              {confidenceLevel === 'ALTA' ? (
                <ShieldCheck size={13} />
              ) : confidenceLevel === 'MEDIA' ? (
                <Info size={13} />
              ) : (
                <AlertCircle size={13} />
              )}
              Muestra: {sampleSize} equipos (Precisión {confidenceLevel})
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Selector de Marca */}
        <div>
          <BrandSelector
            value={selectedBrand}
            onChange={(b) => {
              onBrandChange(b)
            }}
            label="Marca del Equipo"
          />
        </div>

        {/* Selector de Modelo */}
        <div>
          <ModelSelector
            value={selectedModel}
            brand={selectedBrand}
            onChange={onModelChange}
            label="Modelo del Equipo"
          />
        </div>

        {/* Filtro de Tipo de Servicio */}
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase block mb-1.5 flex items-center gap-1.5">
            <Filter size={12} className="text-neon-blue" /> Tipo de Servicio
          </label>
          <select
            value={selectedServiceType}
            onChange={(e) => onServiceTypeChange(e.target.value)}
            className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs focus:border-neon-blue focus:outline-none text-text-primary h-[38px]"
          >
            <option value="">Todos los tipos de servicio</option>
            <option value="REVISION_GENERAL">Revisión General</option>
            <option value="GARANTIA_CABELAB">Garantía Cabelab</option>
            <option value="GARANTIA_ESAB">Garantía ESAB</option>
          </select>
        </div>
      </div>

      {/* Accesos rápidos a modelos con más intervenciones */}
      {topModels.length > 0 && !selectedModel && (
        <div className="pt-2 border-t border-border-subtle/50">
          <span className="text-[11px] text-text-secondary font-semibold uppercase mr-2 block sm:inline mb-1.5 sm:mb-0">
            Modelos con mayor historial:
          </span>
          <div className="inline-flex flex-wrap gap-1.5">
            {topModels.slice(0, 8).map((m, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onBrandChange(m.brand)
                  onModelChange(m.model)
                }}
                className="px-2.5 py-1 rounded-md bg-bg-elevated hover:bg-neon-blue/10 border border-border-subtle hover:border-neon-blue/40 text-text-secondary hover:text-neon-blue text-xs font-mono transition-all flex items-center gap-1.5"
              >
                <span>
                  {m.brand} {m.model}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-text-muted">
                  {m.total_services}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
