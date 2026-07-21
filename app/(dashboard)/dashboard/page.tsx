// app/(dashboard)/dashboard/page.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useDashboardStats, useEquipmentList } from '@/hooks/useEquipmentList'
import EquipmentTable from '@/components/equipment/EquipmentTable'

export default function DashboardPage() {
  const [activePage, setActivePage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { stats, isLoading: loadingStats, mutate: mutateStats } = useDashboardStats()
  const { equipments, total, totalPages, isLoading: loadingEquips, mutate: mutateEquips } = useEquipmentList(
    activePage,
    true,
    statusFilter,
    serviceFilter
  )

  // Búsqueda con debounce de 350ms
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)

    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null)
      return
    }

    searchTimer.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/equipment/search?q=${encodeURIComponent(searchQuery.trim())}&include_delivered=true`)
        const data = await res.json()
        if (data.success) {
          setSearchResults(data.data.results || [])
        } else {
          setSearchResults([])
        }
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchQuery])

  const handleUpdateSuccess = () => {
    mutateStats()
    mutateEquips()
  }

  // Determina qué lista mostrar
  const displayEquipments = searchResults !== null ? searchResults : equipments
  const displayTotal = searchResults !== null ? searchResults.length : total
  const isInSearchMode = searchResults !== null
  const showLoader = isSearching || (loadingEquips && !isInSearchMode)

  // Lista de estados para el filtro (podría venir de una tabla maestra en el futuro)
  const statusOptions = [
    'En espera de diagnóstico', 
    'En diagnóstico', 
    'Pendiente de aprobación', 
    'Aprobado', 
    'En mantenimiento', 
    'En espera de repuesto', 
    'En espera de repuesto adicional', 
    'Control de calidad', 
    'Listo para entrega', 
    'Entregado', 
    'REVISION', 
    'PRESTAMO'
  ]

  const serviceOptions = ['REVISION_GENERAL', 'GARANTIA_CABELAB', 'GARANTIA_ESAB']

  return (
    <div className="space-y-6 font-sans text-text-primary p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neon-blue tracking-wider uppercase">📊 Dashboard Administrativo</h1>
        <p className="text-text-secondary text-xs mt-1">Métricas globales y registro histórico de toda la base de datos.</p>
      </div>

      {/* Stats Grid - AT TOP */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-bg-surface border border-border-subtle rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {/* Total Registrados */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-[0_0_12px_rgba(255,255,255,0.02)] hover:border-text-primary/20 transition-all">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Total en Base de Datos</span>
            <div className="text-2xl font-bold text-text-primary mt-1 font-mono">{stats.total_registered}</div>
          </div>
          {/* Activos */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-[0_0_12px_rgba(0,229,255,0.03)] hover:border-neon-blue/20 transition-all">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Equipos Activos</span>
            <div className="text-2xl font-bold text-neon-blue mt-1 font-mono">{stats.total_active}</div>
          </div>
          {/* Atrasados */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-[0_0_12px_rgba(239,68,68,0.03)] hover:border-red-500/20 transition-all">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Atrasados (+5 Días)</span>
            <div className="text-2xl font-bold text-red-500 mt-1 font-mono">{stats.total_delayed}</div>
          </div>
          {/* Entregados este mes */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-[0_0_12px_rgba(16,185,129,0.03)] hover:border-emerald-500/20 transition-all">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Entregados este Mes</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{stats.delivered_this_month}</div>
          </div>
          {/* Tiempo promedio */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-[0_0_12px_rgba(157,78,221,0.03)] hover:border-neon-purple/20 transition-all">
            <span className="text-[10px] font-bold text-neon-purple uppercase tracking-wider">Promedio Entrega</span>
            <div className="text-2xl font-bold text-neon-purple mt-1 font-mono">{stats.avg_days_to_delivery}d</div>
          </div>
        </div>
      ) : null}

      {/* Main Global Equipment Section */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-subtle/30 pb-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neon-blue">📋 Registro General de Equipos ({displayTotal})</h2>
            <p className="text-[10px] text-text-muted">Filtrando en toda la base de datos. Ordenado por FR más reciente.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar FR, cliente..."
                className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary focus:border-neon-blue focus:outline-none transition-all"
              />
              {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neon-blue animate-pulse font-mono">...</span>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setActivePage(0); }}
                className="flex-1 sm:flex-none bg-bg-elevated border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-primary focus:border-neon-blue focus:outline-none transition-all"
              >
                <option value="">Todos los Estados</option>
                {statusOptions.map((opt: any) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <select
                value={serviceFilter}
                onChange={(e) => { setServiceFilter(e.target.value); setActivePage(0); }}
                className="flex-1 sm:flex-none bg-bg-elevated border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-primary focus:border-neon-blue focus:outline-none transition-all"
              >
                <option value="">Todos los Servicios</option>
                {serviceOptions.map((opt: any) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Indicadores de búsqueda activa */}
        {isInSearchMode && (
          <div className="px-1">
            <span className="text-[10px] text-text-secondary font-mono">
              Resultados para: <span className="text-neon-blue font-bold">"{searchQuery}"</span>
              <button 
                onClick={() => setSearchQuery('')}
                className="ml-2 text-text-muted hover:text-red-400 transition-colors"
              >
                [Limpiar]
              </button>
            </span>
          </div>
        )}

        {/* Equipment Table */}
        {showLoader ? (
          <div className="flex justify-center items-center py-12">
            <span className="text-neon-blue animate-pulse font-mono text-xs uppercase tracking-widest">
              {isSearching ? 'Buscando en base de datos...' : 'Cargando registros...'}
            </span>
          </div>
        ) : (
          <EquipmentTable
            equipments={displayEquipments}
            currentPage={isInSearchMode ? 0 : activePage}
            totalPages={isInSearchMode ? 1 : totalPages}
            onPageChange={isInSearchMode ? undefined : setActivePage}
            onUpdateSuccess={handleUpdateSuccess}
          />
        )}
      </div>

    </div>
  )
}
