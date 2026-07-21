// app/(dashboard)/dna/page.tsx
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import StatusBadge from '@/components/equipment/StatusBadge'
import EquipmentDetail from '@/components/equipment/EquipmentDetail'

interface DNAData {
  found: boolean
  serial: string
  machineInfo?: {
    serial_number: string
    brand: string
    model: string
    total_interventions: number
    last_service: string
    clients: string[]
  }
  interventions: any[]
}

function DNAContent() {
  const searchParams = useSearchParams()
  const [serialSearch, setSerialSearch] = useState('')
  const [data, setData] = useState<DNAData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Efecto para buscar automáticamente si viene en la URL
  useEffect(() => {
    const s = searchParams.get('s')
    if (s) {
      setSerialSearch(s)
      performSearch(s)
    }
  }, [searchParams])

  const performSearch = async (serial: string) => {
    if (!serial.trim()) return

    try {
      setLoading(true)
      const res = await fetch(`/api/equipment/serial/${encodeURIComponent(serial.trim())}`)
      const resData = await res.json()
      if (resData.success) {
        setData(resData.data)
        if (!resData.data.found) {
          toast.info('No se encontraron registros previos para este N° de Serie')
        }
      } else {
        toast.error(resData.error || 'Error al buscar DNA del equipo')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(serialSearch)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  return (
    <div className="space-y-8 font-sans text-text-primary p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-neon-purple flex items-center gap-2">
            🧬 DNA del Equipo <span className="text-[10px] bg-neon-purple/20 border border-neon-purple/40 px-2 py-0.5 rounded text-neon-purple font-mono">LIFECYCLE TRACKER</span>
          </h1>
          <p className="text-xs text-text-secondary uppercase tracking-wider mt-1">
            Historial clínico completo por número de serie.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
          <input
            type="text"
            value={serialSearch}
            onChange={(e) => setSerialSearch(e.target.value.toUpperCase())}
            placeholder="INGRESE N° SERIE..."
            className="flex-1 md:w-64 bg-bg-surface border border-border-subtle focus:border-neon-purple rounded-lg px-4 py-2.5 text-xs text-text-primary focus:outline-none transition-all font-mono"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-neon-purple text-white text-xs font-bold uppercase rounded-lg hover:shadow-neon-purple transition-all disabled:opacity-50"
          >
            {loading ? '🔍' : 'Buscar'}
          </button>
        </form>
      </div>

      {!data ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border-subtle/30 rounded-3xl opacity-40">
          <div className="text-6xl mb-4">🧬</div>
          <p className="text-sm font-bold uppercase tracking-widest text-text-muted">Esperando Número de Serie para Secuenciar...</p>
        </div>
      ) : !data.found ? (
        <div className="text-center py-20 bg-bg-surface/30 rounded-2xl border border-border-subtle italic text-text-muted">
          No se encontró historial para el N° de Serie: <span className="text-text-primary font-mono">{data.serial}</span>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          {/* Machine DNA Header Card */}
          <div className="bg-bg-surface border-2 border-neon-purple/30 rounded-3xl p-6 md:p-8 shadow-neon-purple/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-3xl -mr-16 -mt-16" />
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
               <div className="space-y-1">
                 <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Identidad del Equipo</span>
                 <h2 className="text-2xl font-black text-text-primary font-mono tracking-tighter">{data.machineInfo?.serial_number}</h2>
                 <p className="text-neon-purple font-bold text-sm">{data.machineInfo?.brand} — {data.machineInfo?.model}</p>
               </div>

               <div className="space-y-4 border-l border-border-subtle/50 pl-8">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-base border border-border-subtle flex items-center justify-center text-xl">🛠️</div>
                    <div>
                      <div className="text-[10px] text-text-muted font-bold uppercase">Intervenciones</div>
                      <div className="text-lg font-bold text-text-primary">{data.machineInfo?.total_interventions} Registros</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-base border border-border-subtle flex items-center justify-center text-xl">🏢</div>
                    <div>
                      <div className="text-[10px] text-text-muted font-bold uppercase">Clientes Históricos</div>
                      <div className="text-xs font-bold text-text-primary truncate max-w-[200px]">{data.machineInfo?.clients.join(', ')}</div>
                    </div>
                 </div>
               </div>

               <div className="flex flex-col justify-center items-end border-l border-border-subtle/50 pl-8">
                  <div className="text-right">
                    <div className="text-[10px] text-text-muted font-bold uppercase">Estado Actual / Último</div>
                    <StatusBadge status={data.interventions[0].status_name} color={data.interventions[0].status_color} />
                    <div className="text-[10px] text-text-muted mt-2 uppercase">Último Ingreso: {formatDate(data.machineInfo!.last_service)}</div>
                  </div>
               </div>
             </div>
          </div>

          {/* Timeline of interventions */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Línea de Tiempo de Intervenciones</h3>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-neon-purple/50 before:via-border-subtle before:to-transparent">
              {data.interventions.map((item, idx) => (
                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-neon-purple/50 bg-bg-surface text-neon-purple shadow-neon-purple/20 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-mono text-[10px] font-bold">
                    #{data.interventions.length - idx}
                  </div>
                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-bg-surface/50 border border-border-subtle p-4 rounded-2xl hover:border-neon-purple/40 transition-all cursor-pointer shadow-sm"
                       onClick={() => { setSelectedEqId(item.id); setIsDetailOpen(true); }}>
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-neon-blue font-mono text-xs uppercase">{item.fr_number}</div>
                      <time className="font-mono text-[10px] text-text-muted">{formatDate(item.date_in)}</time>
                    </div>
                    <div className="text-xs font-medium text-text-primary mb-2 uppercase">{item.client_name}</div>
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      <StatusBadge status={item.status_name} color={item.status_color} />
                      <span className="text-[10px] text-text-muted font-bold uppercase">Ver Ficha ➔</span>
                    </div>
                    {item.additional_observations && (
                      <div className="mt-3 pt-3 border-t border-border-subtle/30 text-[10px] text-text-secondary italic line-clamp-2">
                        Obs: {item.additional_observations}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedEqId && (
        <EquipmentDetail
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setSelectedEqId(null)
          }}
          equipmentId={selectedEqId}
        />
      )}
    </div>
  )
}

export default function DNAPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20 text-sm text-neon-purple font-mono tracking-widest animate-pulse">
        SECUENCIANDO DNA OPERATIVO...
      </div>
    }>
      <DNAContent />
    </Suspense>
  )
}
