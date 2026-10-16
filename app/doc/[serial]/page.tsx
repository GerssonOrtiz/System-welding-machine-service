// app/doc/[serial]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  FileText, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  AlertCircle,
  Calendar,
  Building2,
  Cpu
} from 'lucide-react'

interface Intervention {
  id: string
  fr_number: string
  date_in: string
  report_number: string | null
  report_url: string | null
  service_type: string
  status_name: string
  status_color: string
}

interface MachineData {
  found: boolean
  serial: string
  message?: string
  machineInfo?: {
    serial_number: string
    brand: string
    model: string
    client_name: string
    total_interventions: number
    latest_report_url: string | null
    latest_report_number: string | null
    last_service: string
  }
  interventions: Intervention[]
}

export default function PublicEquipmentDocPage() {
  const params = useParams()
  const rawSerial = typeof params?.serial === 'string' ? params.serial : ''
  const serial = decodeURIComponent(rawSerial)

  const [data, setData] = useState<MachineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!serial) {
      setLoading(false)
      setError('Número de serie no especificado.')
      return
    }

    const fetchDoc = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/equipment/serial/${encodeURIComponent(serial)}`)
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.error || 'No se pudo cargar la información técnica.')
        }
      } catch (err: any) {
        setError('Error al conectar con los servidores de CABELAB.')
      } finally {
        setLoading(false)
      }
    }

    fetchDoc()
  }, [serial])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-bg-forge text-text-forge font-sans antialiased selection:bg-amber-core/20 selection:text-amber-glow">
      {/* Background glow effects - warm amber and forge glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-amber-core/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[320px] bg-amber-dim/10 blur-[130px] rounded-full" />
      </div>

      {/* Header institucional */}
      <header className="relative border-b border-white/[0.08] bg-bg-surface/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-black/50 border border-amber-core/30 overflow-hidden flex items-center justify-center p-1 shadow-md shadow-amber-core/10">
              <Image
                src="/cabelab.png"
                alt="CABELAB"
                width={32}
                height={32}
                priority
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <span className="font-black text-sm tracking-wider uppercase font-mono text-white block">
                CABELAB
              </span>
              <span className="block text-[10px] text-text-muted font-mono tracking-widest uppercase">
                Centro de Servicios Técnicos
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Trazabilidad Verificada
            </span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-amber-core border-t-transparent animate-spin shadow-lg shadow-amber-core/20" />
            <p className="font-mono text-xs uppercase tracking-widest text-amber-glow animate-pulse">
              Consultando documentación técnica de la máquina...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center space-y-3 glass-card">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h2 className="text-base font-bold text-red-300 uppercase tracking-wide">Error de Consulta</h2>
            <p className="text-xs text-text-muted">{error}</p>
          </div>
        ) : !data || !data.found ? (
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-3xl mx-auto shadow-inner">
              🔍
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">Equipo no Registrado</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              No se encontró historial técnico para el número de serie{' '}
              <span className="text-amber-glow font-mono font-bold bg-amber-core/10 border border-amber-core/20 px-2 py-0.5 rounded">
                {serial}
              </span>
              . {data?.message || 'Si la máquina acaba de ingresar a taller, el registro se actualizará en breve.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Tarjeta de Identidad del Equipo */}
            <div className="relative glass-card rounded-3xl p-6 md:p-8 overflow-hidden shadow-glass">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-core/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider">
                    <Cpu className="w-4 h-4 text-amber-glow" />
                    <span>Motosoldadora / Equipo de Soldadura</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                    {data.machineInfo?.brand} <span className="text-amber-glow">{data.machineInfo?.model}</span>
                  </h1>
                  <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                    <span className="text-text-muted">N° DE SERIE:</span>
                    <span className="font-bold text-amber-glow bg-amber-core/10 border border-amber-core/20 px-2.5 py-0.5 rounded">
                      {data.machineInfo?.serial_number}
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col items-start md:items-end justify-between gap-2 border-t md:border-t-0 border-white/[0.08] pt-4 md:pt-0">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Historial de Servicios
                  </span>
                  <span className="font-mono text-xl font-black text-amber-glow">
                    {data.machineInfo?.total_interventions}{' '}
                    <span className="text-xs text-text-muted font-normal">
                      {data.machineInfo?.total_interventions === 1 ? 'ingreso registrado' : 'ingresos registrados'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-6 text-xs">
                <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                  <Building2 className="w-5 h-5 text-text-muted shrink-0" />
                  <div className="truncate">
                    <span className="block text-[10px] text-text-muted uppercase font-bold">Cliente Habitual</span>
                    <span className="font-bold text-white uppercase truncate">{data.machineInfo?.client_name || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                  <Calendar className="w-5 h-5 text-text-muted shrink-0" />
                  <div>
                    <span className="block text-[10px] text-text-muted uppercase font-bold">Último Ingreso</span>
                    <span className="font-bold text-white uppercase">{formatDate(data.machineInfo?.last_service || null)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06] sm:col-span-2 md:col-span-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-text-muted uppercase font-bold">Garantía / Soporte</span>
                    <span className="font-bold text-emerald-400 uppercase">Taller Oficial Arequipa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN DESTACADA: ÚLTIMO INFORME TÉCNICO VIGENTE */}
            <div className="relative bg-gradient-to-br from-bg-surface via-bg-surface/90 to-bg-surface border-2 border-amber-core/40 rounded-3xl p-6 md:p-8 shadow-amber-glow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-core/20 border border-amber-core/40 flex items-center justify-center text-amber-glow shadow-sm">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      Último Informe Técnico de Servicio
                    </h2>
                    <p className="text-[11px] text-text-muted">
                      Diagnóstico y reporte oficial emitido por CABELAB
                    </p>
                  </div>
                </div>

                {data.machineInfo?.latest_report_number && (
                  <span className="font-mono text-xs text-amber-glow bg-amber-core/10 border border-amber-core/30 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                    {data.machineInfo.latest_report_number}
                  </span>
                )}
              </div>

              {data.machineInfo?.latest_report_url ? (
                <div className="mt-4 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    El documento técnico completo está digitalizado y listo para consulta o descarga.
                  </p>
                  <a
                    href={data.machineInfo.latest_report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-core to-amber-glow text-bg-forge font-black text-xs uppercase tracking-wider rounded-xl shadow-amber-glow hover:shadow-vip-amber transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Ver / Descargar Informe PDF</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-white/[0.08] text-xs text-text-muted italic">
                  El informe digitalizado de este servicio se encuentra en proceso de validación técnica o archivo interno.
                </div>
              )}
            </div>

            {/* HISTORIAL COMPLETO DE INGRESOS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-core" />
                  Historial Cronológico de Mantenimientos
                </h3>
                <span className="text-[10px] font-mono text-text-muted uppercase">
                  Ordenado por fecha más reciente
                </span>
              </div>

              <div className="space-y-3">
                {data.interventions.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="glass-card-hover rounded-2xl p-4 md:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center font-mono text-xs font-bold text-amber-glow shrink-0 shadow-sm">
                        #{data.interventions.length - index}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-amber-glow uppercase">
                            Ficha: {item.fr_number}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-xs text-text-secondary font-medium">
                            {item.service_type?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-text-muted font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-text-muted" />
                            {formatDate(item.date_in)}
                          </span>
                          {item.report_number && (
                            <span className="text-text-muted">
                              Doc: <strong className="text-white">{item.report_number}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.08]">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${item.status_color}18`,
                          color: item.status_color,
                          border: `1px solid ${item.status_color}40`,
                        }}
                      >
                        {item.status_name}
                      </span>

                      {item.report_url ? (
                        <a
                          href={item.report_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-core/10 hover:bg-amber-core/20 border border-amber-core/30 rounded-lg text-[11px] font-bold text-amber-glow transition-all"
                        >
                          <span>PDF</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-text-muted italic">Sin enlace PDF</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.08] py-8 mt-12 bg-bg-surface/90 flex flex-col items-center justify-center text-xs text-text-muted space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative w-6 h-6 shrink-0">
            <Image
              src="/cabelab.png"
              alt="CABELAB"
              width={24}
              height={24}
              className="object-contain w-full h-full opacity-80"
            />
          </div>
          <span className="font-bold text-xs uppercase font-mono text-white">
            CABELAB
          </span>
        </div>
        <p className="font-medium text-text-secondary">
          Taller de Mantenimiento y Diagnóstico de Motosoldadoras
        </p>
        <p className="text-[11px] text-text-muted">
          Arequipa, Perú • Sistema de Trazabilidad Operativa v2.5
        </p>
      </footer>
    </div>
  )
}
