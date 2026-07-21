// app/(dashboard)/buscar/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useEquipmentSearch } from '@/hooks/useEquipmentList'
import StatusBadge from '@/components/equipment/StatusBadge'
import EquipmentDetail from '@/components/equipment/EquipmentDetail'

export default function BuscarPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Debounce search term to prevent excessive API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { results, total, isLoading, isError, errorMsg } = useEquipmentSearch(debouncedTerm)

  const handleOpenDetail = (id: string) => {
    setSelectedEqId(id)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-6 font-sans text-text-primary p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neon-blue tracking-wider uppercase">🔍 Búsqueda de Equipos</h1>
        <p className="text-text-secondary text-xs mt-1">
          Busque motosoldadoras ingresando Ficha de Recepción, cliente, marca, modelo o número de serie.
        </p>
      </div>

      {/* Search Input Container */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary text-base">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ingrese Ficha (FR-X), Nombre de cliente, Serie, Marca o Modelo..."
            className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,229,255,0.2)] focus:outline-none transition-all"
          />
        </div>
        {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
          <p className="text-red-400 text-xs mt-2">Ingrese al menos 2 caracteres para iniciar la búsqueda.</p>
        )}
      </div>

      {/* Results Container */}
      {debouncedTerm.trim().length >= 2 && (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-border-subtle pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neon-blue">
              Resultados de Búsqueda ({total})
            </h2>
            {isLoading && (
              <span className="text-[10px] text-neon-blue animate-pulse font-mono uppercase tracking-widest">
                Buscando...
              </span>
            )}
          </div>

          {isError && (
            <p className="text-xs text-red-400 text-center py-4">{errorMsg || 'Error al realizar la búsqueda'}</p>
          )}

          {!isLoading && results.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-8">
              No se encontraron coincidencias para &quot;{debouncedTerm}&quot;.
            </p>
          ) : (
            <div className="divide-y divide-border-subtle/50">
              {results.map((eq: any) => {
                const isDelayed = eq.days_elapsed > 5 && !eq.is_terminal
                return (
                  <div
                    key={eq.id}
                    onClick={() => handleOpenDetail(eq.id)}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4 hover:bg-bg-base/20 transition-all rounded-lg px-3 cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-neon-blue uppercase group-hover:underline">
                          {eq.fr_number}
                        </span>
                        <StatusBadge status={eq.status_name} color={eq.status_color} />
                        {isDelayed && (
                          <span className="text-red-500 font-bold text-[10px] animate-pulse">⚠️ ATRASADO</span>
                        )}
                      </div>
                      <div className="text-xs text-text-secondary">
                        <strong className="text-text-primary">{eq.client_name}</strong> &middot; {eq.brand} - {eq.model} (S/N: {eq.serial_number})
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-text-secondary">
                        {eq.days_elapsed} días transcurridos
                      </span>
                      <button className="px-3 py-1 text-[10px] font-semibold border border-neon-blue text-neon-blue rounded hover:bg-neon-blue/10 uppercase transition-all">
                        Detalle
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Detalle */}
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
