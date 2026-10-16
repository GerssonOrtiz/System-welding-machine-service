// app/doc/fr/[fr]/page.tsx
// Página pública para equipos sin número de serie — accesible por QR via FR number.
// Exenta de autenticación (middleware.ts permite /doc/*).
'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import {
  FileText,
  ExternalLink,
  AlertCircle,
  Calendar,
  Building2,
  Cpu,
  Hash,
  ShieldCheck,
  Info,
} from 'lucide-react'

interface EntryData {
  id: string
  fr_number: string
  serial_number: string | null
  brand: string
  model: string
  client_name: string
  date_in: string
  report_number: string | null
  report_url: string | null
  service_type: string
  status_name: string
  status_color: string
}

interface ApiResponse {
  found: boolean
  fr?: string
  entry?: EntryData
}

export default function PublicEquipmentFrPage() {
  const params = useParams()
  const rawFr = typeof params?.fr === 'string' ? params.fr : ''
  const fr = decodeURIComponent(rawFr)

  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!fr) {
      setLoading(false)
      setError('Número de ficha no especificado.')
      return
    }

    const fetchDoc = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/public/equipment/fr/${encodeURIComponent(fr)}`)
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.error || 'No se pudo cargar la información del equipo.')
        }
      } catch {
        setError('Error al conectar con los servidores de CABELAB.')
      } finally {
        setLoading(false)
      }
    }

    fetchDoc()
  }, [fr])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const entry = data?.entry

  return (
    <div className="min-h-screen bg-bg-forge text-text-forge font-sans antialiased selection:bg-amber-core/20 selection:text-amber-glow">
      {/* Background glow effects - warm amber ambient lighting */}
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-core/10 border border-amber-core/30 text-amber-glow shadow-sm">
              <Hash className="w-3 h-3 text-amber-glow" />
              Ficha de Ingreso
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
              Consultando ficha de ingreso...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center space-y-3 glass-card">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h2 className="text-base font-bold text-red-300 uppercase tracking-wide">Error de Consulta</h2>
            <p className="text-xs text-text-muted">{error}</p>
          </div>
        ) : !data || !data.found || !entry ? (
          <div className="glass-card rounded-3xl p-8 md:p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-3xl mx-auto shadow-inner">
              🔍
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">Ficha no Encontrada</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              No se encontró ningún ingreso con la ficha{' '}
              <span className="text-amber-glow font-mono font-bold bg-amber-core/10 border border-amber-core/20 px-2 py-0.5 rounded">
                {fr}
              </span>
              . Si el equipo acaba de ingresar, el registro se actualizará en breve.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">

            {/* Aviso: equipo sin número de serie */}
            <div className="flex items-start gap-3 bg-amber-core/10 border border-amber-core/30 rounded-2xl px-4 py-3 glass-card">
              <Info className="w-4 h-4 text-amber-glow shrink-0 mt-0.5" />
              <p className="text-xs text-amber-glow/90 leading-relaxed">
                Este equipo no tiene número de serie registrado. El QR identifica únicamente
                este ingreso al taller (<span className="font-mono font-bold text-white">{entry.fr_number}</span>).
              </p>
            </div>

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
                    {entry.brand} <span className="text-amber-glow">{entry.model}</span>
                  </h1>
                  <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                    <span className="text-text-muted">N° SERIE:</span>
                    <span className="font-bold text-text-muted italic bg-white/[0.03] border border-white/[0.08] px-2.5 py-0.5 rounded">
                      Sin número de serie
                    </span>
                  </div>
                </div>

                {/* Badge de estado */}
                <div className="flex md:flex-col items-start md:items-end justify-between gap-2 border-t md:border-t-0 border-white/[0.08] pt-4 md:pt-0">
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Estado Actual
                  </span>
                  <span
                    className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm"
                    style={{
                      backgroundColor: `${entry.status_color}20`,
                      color: entry.status_color,
                      border: `1px solid ${entry.status_color}50`,
                    }}
                  >
                    {entry.status_name}
                  </span>
                </div>
              </div>

              {/* Datos clave */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
                <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                  <Hash className="w-5 h-5 text-amber-glow shrink-0" />
                  <div className="truncate">
                    <span className="block text-[10px] text-text-muted uppercase font-bold">Ficha (FR)</span>
                    <span className="font-bold text-white font-mono truncate">{entry.fr_number}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                  <Building2 className="w-5 h-5 text-text-muted shrink-0" />
                  <div className="truncate">
                    <span className="block text-[10px] text-text-muted uppercase font-bold">Cliente</span>
                    <span className="font-bold text-white uppercase truncate">{entry.client_name || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/[0.06]">
                  <Calendar className="w-5 h-5 text-text-muted shrink-0" />
                  <div>
                    <span className="block text-[10px] text-text-muted uppercase font-bold">Fecha de Ingreso</span>
                    <span className="font-bold text-white">{formatDate(entry.date_in)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tipo de servicio */}
            <div className="flex items-center gap-3 glass-card rounded-2xl px-4 py-3">
              <ShieldCheck className="w-5 h-5 text-amber-core shrink-0" />
              <div>
                <span className="block text-[10px] text-text-muted uppercase font-bold tracking-wider">Tipo de Servicio</span>
                <span className="text-sm font-bold text-white uppercase">
                  {entry.service_type?.replace(/_/g, ' ') || '-'}
                </span>
              </div>
            </div>

            {/* Informe técnico */}
            <div className="relative bg-gradient-to-br from-bg-surface via-bg-surface/90 to-bg-surface border-2 border-amber-core/40 rounded-3xl p-6 md:p-8 shadow-amber-glow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-core/20 border border-amber-core/40 flex items-center justify-center text-amber-glow shadow-sm">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      Informe Técnico de Servicio
                    </h2>
                    <p className="text-[11px] text-text-muted">
                      Diagnóstico y reporte oficial emitido por CABELAB
                    </p>
                  </div>
                </div>

                {entry.report_number && (
                  <span className="font-mono text-xs text-amber-glow bg-amber-core/10 border border-amber-core/30 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                    {entry.report_number}
                  </span>
                )}
              </div>

              {entry.report_url ? (
                <div className="mt-4 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    El documento técnico está digitalizado y listo para consulta o descarga.
                  </p>
                  <a
                    href={entry.report_url}
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
