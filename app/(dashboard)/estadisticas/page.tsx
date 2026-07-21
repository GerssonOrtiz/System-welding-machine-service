// app/(dashboard)/estadisticas/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'

interface StatsData {
  total_registered: number
  total_active: number
  total_delayed: number
  delivered_this_month: number
  avg_days_to_delivery: number
  by_status: Array<{ status_name: string; count: number; color: string }>
  by_service_type: Array<{ service_type: string; count: number }>
  by_brand: Array<{ brand: string; count: number }>
  by_company: Array<{ 
    name: string; 
    total: number; 
    by_status: Array<{ status: string; count: number }>;
    by_brand: Array<{ brand: string; count: number }>;
    top_models: Array<{ model: string; count: number }>;
    recent_equipment: Array<{ brand: string; model: string; date_in: string; fr_number: string }>;
  }>
  delayed_equipment: Array<{ fr_number: string; client_name: string; status_name: string; days_elapsed: number }>
}

export default function EstadisticasPage() {
  const { role } = useUser()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [companySearch, setCompanySearch] = useState('')

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      } else {
        toast.error(data.error || 'Error al cargar estadísticas')
      }
    } catch {
      toast.error('Error de red al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const allowedRoles = ['superadmin', 'admin', 'visualizador']
    if (role && allowedRoles.includes(role)) {
      fetchStats()
    }
  }, [role])

  const allowedRoles = ['superadmin', 'admin', 'visualizador']
  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-2 p-6">
        <h2 className="text-xl font-extrabold uppercase text-red-500 tracking-wider">Acceso Restringido</h2>
        <p className="text-text-secondary text-sm max-w-md text-center">
          Esta sección está disponible para roles Administrativos y Visualizadores autorizados.
        </p>
      </div>
    )
  }

  if (loading || !stats) {
    return (
      <div className="text-center py-20 text-sm text-neon-blue font-mono tracking-widest animate-pulse">
        CALCULANDO ESTADÍSTICAS OPERATIVAS...
      </div>
    )
  }

  const serviceTypeLabels: Record<string, string> = {
    REVISION_GENERAL: 'Revisión General',
    MANTENIMIENTO_PREVENTIVO: 'Mant. Preventivo',
    GARANTIA_CABELAB: 'Garantía Cabelab',
    REPARACION_MAYOR: 'Reparación Mayor',
    GARANTIA_ESAB: 'Garantía ESAB'
  }

  return (
    <div className="space-y-8 font-sans text-text-primary p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold uppercase tracking-widest text-neon-blue">
          📊 Reportes y Analíticas Globales
        </h1>
        <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">
          Análisis completo de toda la base de datos (Activos + Entregados).
        </p>
      </div>

      {/* ─── 5 CARDS DE MÉTRICAS RÁPIDAS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Registrados */}
        <div className="bg-bg-surface/50 border border-border-subtle rounded-xl p-5 hover:border-text-primary/20 transition-all">
          <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">Histórico Total</span>
          <div className="text-3xl font-extrabold text-text-primary mt-2 font-mono">
            {stats.total_registered}
          </div>
          <div className="text-[10px] text-text-muted mt-1 uppercase">Equipos en el sistema</div>
        </div>

        {/* Activos */}
        <div className="bg-bg-surface/50 border border-border-subtle rounded-xl p-5 hover:border-neon-blue/20 transition-all">
          <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">Activos en Taller</span>
          <div className="text-3xl font-extrabold text-neon-blue mt-2 font-mono">
            {stats.total_active}
          </div>
          <div className="text-[10px] text-text-muted mt-1 uppercase">En proceso actual</div>
        </div>

        {/* Atrasados */}
        <div className="bg-bg-surface/50 border border-border-subtle rounded-xl p-5 hover:border-red-500/20 transition-all">
          <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">Equipos Atrasados</span>
          <div className="text-3xl font-extrabold text-red-500 mt-2 font-mono flex items-center gap-2">
            {stats.total_delayed}
            {stats.total_delayed > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <div className="text-[10px] text-text-muted mt-1 uppercase">Con más de 5 días</div>
        </div>

        {/* Entregas del mes */}
        <div className="bg-bg-surface/50 border border-border-subtle rounded-xl p-5 hover:border-emerald-500/20 transition-all">
          <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">Entregados del Mes</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
            {stats.delivered_this_month}
          </div>
          <div className="text-[10px] text-text-muted mt-1 uppercase">Culminados este mes</div>
        </div>

        {/* Promedio de días */}
        <div className="bg-bg-surface/50 border border-border-subtle rounded-xl p-5 hover:border-purple-500/20 transition-all">
          <span className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">Promedio de Entrega</span>
          <div className="text-3xl font-extrabold text-purple-400 mt-2 font-mono">
            {stats.avg_days_to_delivery} <span className="text-sm font-normal">d</span>
          </div>
          <div className="text-[10px] text-text-muted mt-1 uppercase">Últimos 30 días</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── DISTRIBUCIÓN POR ESTADO ─── */}
        <div className="lg:col-span-7 bg-bg-surface/40 border border-border-subtle rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary border-b border-border-subtle/50 pb-2">
            Distribución Histórica por Estado
          </h3>
          <div className="space-y-3.5">
            {stats.by_status.map((item) => {
              const percentage = stats.total_registered > 0 ? (item.count / stats.total_registered) * 100 : 0
              return (
                <div key={item.status_name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="uppercase text-text-secondary flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.status_name}
                    </span>
                    <span className="font-bold text-text-primary">{item.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-base border border-border-subtle/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── DISTRIBUCIÓN POR TIPO DE SERVICIO ─── */}
        <div className="lg:col-span-5 bg-bg-surface/40 border border-border-subtle rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary border-b border-border-subtle/50 pb-2">
            Tipo de Servicio (Global)
          </h3>
          <div className="space-y-4">
            {stats.by_service_type.map((item) => {
              const percentage = stats.total_registered > 0 ? (item.count / stats.total_registered) * 100 : 0
              return (
                <div key={item.service_type} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="uppercase text-text-secondary">
                      {serviceTypeLabels[item.service_type] || item.service_type}
                    </span>
                    <span className="font-bold text-text-primary">
                      {item.count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-base border border-border-subtle/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neon-blue rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── DISTRIBUCIÓN POR MARCA (TOP 10) ─── */}
      <div className="bg-bg-surface/40 border border-border-subtle rounded-xl p-6 space-y-6 shadow-[0_0_15px_rgba(0,229,255,0.02)]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neon-blue border-b border-border-subtle/50 pb-2">
          🏆 Top 10 Marcas más Registradas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {stats.by_brand.map((item, idx) => {
              const percentage = stats.total_registered > 0 ? (item.count / stats.total_registered) * 100 : 0
              return (
                <div key={item.brand} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="uppercase text-text-secondary flex gap-2">
                      <span className="text-neon-blue font-bold font-mono">#{idx + 1}</span> {item.brand}
                    </span>
                    <span className="font-bold text-text-primary font-mono">{item.count}</span>
                  </div>
                  <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden border border-border-subtle/20">
                    <div 
                      className="h-full bg-gradient-to-r from-neon-blue to-cyan-500 rounded-full transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex flex-col items-center justify-center bg-bg-base/20 rounded-xl border border-dashed border-border-subtle/40 p-8 text-center space-y-4">
            <div className="text-5xl drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]">⚡</div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold uppercase text-text-primary tracking-wider">Análisis de Mercado</h4>
              <p className="text-[10px] text-text-muted leading-relaxed max-w-[250px]">
                Esta visualización considera todos los equipos que han pasado por CABELAB. 
                Permite entender qué fabricantes dominan la demanda de servicio técnico.
              </p>
            </div>
            <div className="pt-4 grid grid-cols-2 gap-4 w-full">
              <div className="bg-bg-surface p-3 rounded-lg border border-border-subtle text-center">
                <div className="text-[10px] text-text-muted uppercase">Líder</div>
                <div className="text-xs font-bold text-neon-blue truncate">{stats.by_brand[0]?.brand || '-'}</div>
              </div>
              <div className="bg-bg-surface p-3 rounded-lg border border-border-subtle text-center">
                <div className="text-[10px] text-text-muted uppercase">Variedad</div>
                <div className="text-xs font-bold text-neon-purple">{stats.by_brand.length} marcas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ESTADÍSTICAS POR EMPRESA ─── */}
      <section className="bg-bg-surface border border-border-subtle rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-subtle/30 pb-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neon-blue flex items-center gap-2">
              🏢 Menú Estadístico por Empresa
            </h2>
            <p className="text-[10px] text-text-muted uppercase">Análisis detallado de equipos por cliente y estado operativo.</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">🔍</span>
            <input
              type="text"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value.toUpperCase())}
              placeholder="Buscar empresa..."
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary focus:border-neon-blue focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lista de Empresas */}
          <div className="bg-bg-base rounded-xl border border-border-subtle overflow-hidden flex flex-col h-[400px]">
            <div className="px-4 py-2 bg-bg-surface border-b border-border-subtle text-[10px] font-bold text-text-secondary uppercase">
              Lista de Clientes
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-border-subtle/30">
              {stats.by_company
                .filter(c => c.name.includes(companySearch))
                .map((company) => (
                  <button
                    key={company.name}
                    onClick={() => setSelectedCompany(company.name)}
                    className={`w-full text-left px-4 py-3 hover:bg-neon-blue/5 transition-colors flex justify-between items-center ${
                      selectedCompany === company.name ? 'bg-neon-blue/10 border-l-2 border-neon-blue' : ''
                    }`}
                  >
                    <span className={`text-xs font-medium truncate max-w-[180px] ${selectedCompany === company.name ? 'text-neon-blue' : 'text-text-primary'}`}>
                      {company.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-bg-surface border border-border-subtle px-2 py-0.5 rounded-full text-text-secondary">
                      {company.total}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Detalle Estadístico */}
          <div className="md:col-span-2 bg-bg-base rounded-xl border border-dashed border-border-subtle/40 p-6 flex flex-col justify-center min-h-[400px]">
            {!selectedCompany ? (
              <div className="text-center space-y-4 py-12">
                <div className="text-4xl opacity-20">📊</div>
                <p className="text-xs text-text-muted uppercase tracking-widest">Selecciona una empresa para ver su desglose estadístico</p>
              </div>
            ) : (() => {
              const company = stats.by_company.find(c => c.name === selectedCompany)
              if (!company) return null
              return (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-end border-b border-border-subtle/50 pb-3">
                    <div>
                      <h4 className="text-lg font-bold text-text-primary">{company.name}</h4>
                      <p className="text-[10px] text-text-muted uppercase">Total histórico registrado: <span className="text-neon-blue font-mono">{company.total} equipos</span></p>
                    </div>
                    <button 
                      onClick={() => setSelectedCompany(null)}
                      className="text-[10px] text-red-400 hover:underline uppercase font-bold"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {company.by_status.map((item) => {
                      const percentage = Math.round((item.count / company.total) * 100)
                      const statusColor = stats.by_status.find(s => s.status_name === item.status) ?.color || '#6B7280'
                      return (
                        <div key={item.status} className="bg-bg-surface border border-border-subtle rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                              {item.status}
                            </span>
                            <span className="text-xs font-mono font-bold text-text-primary">{item.count}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-bg-base rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${percentage}%`, backgroundColor: statusColor }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-text-muted">{percentage}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Nuevas Secciones: Marcas, Modelos y Recientes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-subtle/30">
                    <div className="space-y-6">
                      {/* Marcas de la Empresa */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                          🏷️ Marcas Preferentes
                        </h5>
                        <div className="space-y-2">
                          {company.by_brand.map((b) => (
                            <div key={b.brand} className="flex items-center justify-between group">
                              <span className="text-xs text-text-secondary uppercase">{b.brand}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1 bg-bg-base rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-neon-blue/60" 
                                    style={{ width: `${(b.count / company.total) * 100}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono font-bold text-text-primary w-4 text-right">{b.count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Modelos más Frecuentes */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                          📑 Modelos Recurrentes
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {company.top_models.map((m) => (
                            <div key={m.model} className="bg-bg-surface border border-border-subtle px-2 py-1 rounded flex items-center gap-2 group hover:border-neon-purple/50 transition-colors">
                              <span className="text-[9px] font-bold text-text-primary uppercase">{m.model}</span>
                              <span className="text-[9px] font-mono bg-neon-purple/10 text-neon-purple px-1.5 rounded-full">{m.count}</span>
                            </div>
                          ))}
                        </div>
                        {company.top_models.length === 0 && (
                          <p className="text-[10px] text-text-muted italic px-1">Sin modelos específicos registrados</p>
                        )}
                      </div>
                    </div>

                    {/* Últimos Equipos que Ingresaron */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                        📥 Últimas Entradas (Marca / Modelo)
                      </h5>
                      <div className="bg-bg-base/40 rounded-xl border border-border-subtle/50 overflow-hidden divide-y divide-border-subtle/20">
                        {company.recent_equipment.map((eq, idx) => (
                          <div key={idx} className="px-3 py-2 flex justify-between items-center hover:bg-white/5 transition-colors">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-text-primary uppercase leading-tight">{eq.brand}</span>
                              <span className="text-[9px] text-text-muted uppercase truncate max-w-[150px]">{eq.model}</span>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className="text-[9px] font-mono font-bold text-neon-blue">{eq.fr_number}</span>
                              <span className="text-[8px] text-text-muted font-mono uppercase">{new Date(eq.date_in).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </section>
    </div>
  )
}
