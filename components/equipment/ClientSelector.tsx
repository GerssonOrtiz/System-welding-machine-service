'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, User, Check } from 'lucide-react'

interface ClientSelectorProps {
  value: string
  onChange: (value: string) => void
  error?: string
  label?: string
}

export default function ClientSelector({ value, onChange, error, label }: ClientSelectorProps) {
  const [clients, setClients] = useState<string[]>([])
  const [filteredClients, setFilteredClients] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(value || '')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchClients()

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setSearch(value)
  }, [value])

  const fetchClients = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      if (data.success) {
        setClients(data.data)
        setFilteredClients(data.data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setSearch(val)
    onChange(val)
    setIsOpen(true)

    const filtered = clients.filter(c => 
      c.toLowerCase().includes(val.toLowerCase())
    )
    setFilteredClients(filtered)
  }

  const handleSelectClient = (clientName: string) => {
    const upperName = clientName.toUpperCase()
    setSearch(upperName)
    onChange(upperName)
    setIsOpen(false)
  }

  const isNewClient = search && !clients.some(c => c.toUpperCase() === search.toUpperCase())

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Escriba o seleccione un cliente..."
          className={`w-full bg-bg-elevated border ${
            error ? 'border-red-500/50' : 'border-border-subtle focus:border-neon-blue'
          } rounded-lg pl-10 pr-3.5 py-2.5 text-sm focus:outline-none transition-all`}
          autoComplete="off"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      </div>

      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}

      {/* Tarjeta de Clientes */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 glass-modal border border-amber-border/40 rounded-xl shadow-glass overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 text-center text-sm text-text-forge-dim">
                Cargando clientes...
              </div>
            ) : (
              <>
                {filteredClients.length > 0 ? (
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-text-forge-dim uppercase px-2 py-1 mb-1">
                      Clientes Existentes
                    </p>
                    {filteredClients.map((client) => (
                      <button
                        key={client}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-amber-ghost/40 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-ghost flex items-center justify-center border border-amber-border/40">
                            <User className="w-4 h-4 text-amber-glow" />
                          </div>
                          <span className="text-sm text-text-forge font-medium">{client}</span>
                        </div>
                        {search.toUpperCase() === client.toUpperCase() && (
                          <Check className="w-4 h-4 text-amber-glow" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : !isNewClient && (
                  <div className="p-4 text-center text-sm text-text-forge-dim italic">
                    No se encontraron clientes
                  </div>
                )}

                {/* Opción de Nuevo Cliente */}
                {isNewClient && (
                  <div className="p-2 border-t border-amber-border/20 bg-amber-ghost/20">
                    <button
                      type="button"
                      onClick={() => handleSelectClient(search)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-amber-ghost/40 text-left transition-colors group border border-dashed border-amber-border/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-ghost flex items-center justify-center border border-amber-border">
                        <Plus className="w-4 h-4 text-amber-glow" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-glow uppercase tracking-tight">Nuevo Cliente</p>
                        <p className="text-sm text-text-forge font-medium">{search}</p>
                      </div>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
