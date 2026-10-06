// app/(dashboard)/auditoria-modelos/page.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ModelSelectorHeader } from '@/components/auditoria/ModelSelectorHeader'
import { ModelKpiCards } from '@/components/auditoria/ModelKpiCards'
import { StageGanttTimeline } from '@/components/auditoria/StageGanttTimeline'
import { DeliveryForecastCalculator } from '@/components/auditoria/DeliveryForecastCalculator'
import { DelayFactorsAudit } from '@/components/auditoria/DelayFactorsAudit'
import { ModelAuditDeepData, ModelSummaryData } from '@/lib/stats/model-forecast'
import { Calculator, Sparkles, RefreshCw, BarChart2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AuditoriaModelosPage() {
  usePageTitle('Pronóstico por Modelo')

  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedServiceType, setSelectedServiceType] = useState('')
  const [loading, setLoading] = useState(false)
  const [deepData, setDeepData] = useState<ModelAuditDeepData | null>(null)
  const [topModels, setTopModels] = useState<ModelSummaryData[]>([])

  // Cargar lista de modelos frecuentes
  const fetchTopModels = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/models')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setTopModels(json.data)
      }
    } catch (err) {
      console.error('[AuditoriaModelosPage] Error fetching top models:', err)
    }
  }, [])

  useEffect(() => {
    fetchTopModels()
  }, [fetchTopModels])

  // Cargar análisis profundo del modelo
  const fetchModelDeepData = useCallback(async (brand: string, model: string, serviceType: string) => {
    if (!model.trim()) {
      setDeepData(null)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (brand) params.set('brand', brand)
      if (serviceType) params.set('service_type', serviceType)

      const url = `/api/stats/models/${encodeURIComponent(model)}?${params.toString()}`
      const res = await fetch(url)
      const json = await res.json()

      if (json.success && json.data) {
        setDeepData(json.data)
      } else {
        toast.error(json.error || 'No se pudo obtener la auditoría del modelo')
        setDeepData(null)
      }
    } catch (err) {
      console.error('[AuditoriaModelosPage] Error fetching model deep data:', err)
      toast.error('Error de comunicación con el servidor')
      setDeepData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand)
    setSelectedModel('')
    setDeepData(null)
  }

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    if (model.trim()) {
      fetchModelDeepData(selectedBrand, model, selectedServiceType)
    } else {
      setDeepData(null)
    }
  }

  const handleServiceTypeChange = (st: string) => {
    setSelectedServiceType(st)
    if (selectedModel.trim()) {
      fetchModelDeepData(selectedBrand, selectedModel, st)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
      {/* ── Encabezado Principal ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2.5">
            <Calculator className="text-neon-blue" size={26} />
            Pronóstico Predictivo y Auditoría de Modelos
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Estimación probabilística de tiempos de diagnóstico, aprobación y mantenimiento basada en el historial del taller.
          </p>
        </div>

        {selectedModel && (
          <button
            onClick={() => fetchModelDeepData(selectedBrand, selectedModel, selectedServiceType)}
            disabled={loading}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface border border-border-subtle text-text-secondary hover:text-neon-blue hover:border-neon-blue text-xs font-medium transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-neon-blue' : ''} />
            Actualizar Métricas
          </button>
        )}
      </div>

      {/* ── Selector de Modelo y Filtros ── */}
      <ModelSelectorHeader
        selectedBrand={selectedBrand}
        selectedModel={selectedModel}
        selectedServiceType={selectedServiceType}
        onBrandChange={handleBrandChange}
        onModelChange={handleModelChange}
        onServiceTypeChange={handleServiceTypeChange}
        topModels={topModels}
        confidenceLevel={deepData?.confidence_level}
        sampleSize={deepData?.sample_size}
      />

      {/* ── Contenido Dinámico ── */}
      {loading ? (
        <div className="py-24 text-center bg-bg-surface border border-border-subtle rounded-xl space-y-3">
          <RefreshCw className="mx-auto text-neon-blue animate-spin" size={32} />
          <p className="text-sm font-mono text-neon-blue tracking-wider uppercase">
            Analizando tiempos y clasificando notas de taller...
          </p>
          <span className="text-xs text-text-muted">Procesando registros de servicio y bitácora de transiciones</span>
        </div>
      ) : selectedModel && deepData ? (
        <div className="space-y-6 animate-fade-in">
          {/* Frecuencia por tipo de servicio si hay variedad */}
          {deepData.frequent_services && deepData.frequent_services.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
              <span className="text-text-muted font-semibold uppercase text-[10px] flex items-center gap-1">
                <BarChart2 size={12} className="text-neon-blue" /> Servicios registrados:
              </span>
              {deepData.frequent_services.map((fs, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-bg-surface border border-border-subtle text-text-secondary font-mono text-[11px]"
                >
                  <strong className="text-text-primary">{fs.service_type}</strong>: {fs.count} equipos (~{fs.avg_days}d)
                </span>
              ))}
            </div>
          )}

          {/* Tarjetas KPI de Tiempos */}
          <ModelKpiCards
            timings={deepData.timings}
            brand={deepData.brand}
            modelName={deepData.model_name}
          />

          {/* Gantt Típico Proporcional */}
          <StageGanttTimeline
            timings={deepData.timings}
            includePartsWait={true}
          />

          {/* Grid: Calculadora Predictiva (Izq) + Auditoría de Factores (Der) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 sticky top-4">
              <DeliveryForecastCalculator
                timings={deepData.timings}
                modelName={deepData.model_name}
                brand={deepData.brand}
                sampleSize={deepData.sample_size}
              />
            </div>

            <div className="lg:col-span-7">
              <DelayFactorsAudit
                delayFactors={deepData.delay_factors}
                recentHistory={deepData.recent_history}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Estado inicial sin selección */
        <div className="py-20 text-center bg-bg-surface border border-dashed border-border-subtle rounded-xl space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.1)]">
            <Sparkles size={26} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
              Selecciona una marca y modelo para iniciar la auditoría
            </h3>
            <p className="text-xs text-text-muted max-w-lg mx-auto leading-relaxed">
              El motor de pronóstico analizará automáticamente las etapas de diagnóstico, aprobación y reparación
              para predecir la fecha óptima de entrega y advertir sobre posibles cuellos de botella en repuestos.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
