'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Tag, Check } from 'lucide-react'

interface BrandSelectorProps {
  value: string
  onChange: (value: string) => void
  error?: string
  label?: string
}

export default function BrandSelector({ value, onChange, error, label }: BrandSelectorProps) {
  const [brands, setBrands] = useState<string[]>([])
  const [filteredBrands, setFilteredBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(value || '')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchBrands()

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

  const fetchBrands = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/catalog/brands')
      const data = await res.json()
      if (data.success) {
        setBrands(data.data)
        setFilteredBrands(data.data)
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase()
    setSearch(val)
    onChange(val)
    setIsOpen(true)

    const filtered = brands.filter(b => 
      b.toLowerCase().includes(val.toLowerCase())
    )
    setFilteredBrands(filtered)
  }

  const handleSelectBrand = (brandName: string) => {
    const upperName = brandName.toUpperCase()
    setSearch(upperName)
    onChange(upperName)
    setIsOpen(false)
  }

  const isNewBrand = search && !brands.some(b => b.toUpperCase() === search.toUpperCase())

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
          placeholder="Escriba o seleccione una marca..."
          className={`w-full bg-bg-elevated border ${
            error ? 'border-red-500/50' : 'border-border-subtle focus:border-neon-blue'
          } rounded-lg pl-10 pr-3.5 py-2.5 text-sm focus:outline-none transition-all`}
          autoComplete="off"
        />
        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      </div>

      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}

      {/* Tarjeta de Marcas */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-bg-elevated border border-border-subtle rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 text-center text-sm text-text-muted">
                Cargando marcas...
              </div>
            ) : (
              <>
                {filteredBrands.length > 0 ? (
                  <div className="p-2">
                    <p className="text-[10px] font-bold text-text-muted uppercase px-2 py-1 mb-1">
                      Marcas en Catálogo
                    </p>
                    {filteredBrands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => handleSelectBrand(brand)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neon-blue/10 flex items-center justify-center border border-neon-blue/20">
                            <Tag className="w-4 h-4 text-neon-blue" />
                          </div>
                          <span className="text-sm text-text-primary font-medium">{brand}</span>
                        </div>
                        {search.toUpperCase() === brand.toUpperCase() && (
                          <Check className="w-4 h-4 text-neon-blue" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : !isNewBrand && (
                  <div className="p-4 text-center text-sm text-text-muted italic">
                    No se encontraron marcas
                  </div>
                )}

                {/* Opción de Nueva Marca */}
                {isNewBrand && (
                  <div className="p-2 border-t border-border-subtle bg-neon-purple/5">
                    <button
                      type="button"
                      onClick={() => handleSelectBrand(search)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-neon-purple/10 text-left transition-colors group border border-dashed border-neon-purple/30"
                    >
                      <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center border border-neon-purple/30">
                        <Plus className="w-4 h-4 text-neon-purple" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neon-purple uppercase tracking-tight">Nueva Marca</p>
                        <p className="text-sm text-text-primary font-medium">{search}</p>
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
