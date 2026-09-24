// components/admin/BrandModelManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CatalogBrand, CatalogModel } from '@/types/catalog'
import { toast } from 'sonner'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { 
  Layers, 
  Plus, 
  Trash2, 
  Search, 
  Tag, 
  Cpu, 
  AlertCircle 
} from 'lucide-react'

export default function BrandModelManager() {
  const supabase: SupabaseClient<Database> = createClient()
  const [brands, setBrands] = useState<CatalogBrand[]>([])
  const [models, setModels] = useState<CatalogModel[]>([])
  const [loading, setLoading] = useState(true)
  
  const [newBrand, setNewBrand] = useState('')
  const [addingBrand, setAddingBrand] = useState(false)
  
  const [newModel, setNewModel] = useState({ brandId: '', name: '' })
  const [addingModel, setAddingModel] = useState(false)

  const [brandSearch, setBrandSearch] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: brandsData } = await supabase.from('catalog_brands').select('*').order('name')
    const { data: modelsData } = await supabase.from('catalog_models').select('*').order('name')
    
    setBrands(brandsData || [])
    setModels(modelsData || [])
    setLoading(false)
  }

  async function handleAddBrand(e: React.FormEvent) {
    e.preventDefault()
    if (!newBrand.trim()) return
    setAddingBrand(true)
    const { error } = await supabase.from('catalog_brands').insert([{ name: newBrand.trim().toUpperCase() }])
    setAddingBrand(false)
    if (error) {
      toast.error('Error al añadir marca: ' + error.message)
    } else {
      toast.success('Marca añadida al catálogo')
      setNewBrand('')
      fetchData()
    }
  }

  async function handleAddModel(e: React.FormEvent) {
    e.preventDefault()
    if (!newModel.brandId || !newModel.name.trim()) {
      toast.error('Selecciona una marca e ingresa el nombre del modelo')
      return
    }
    setAddingModel(true)
    const { error } = await supabase.from('catalog_models').insert([{ 
      brand_id: newModel.brandId, 
      name: newModel.name.trim().toUpperCase() 
    }])
    setAddingModel(false)
    if (error) {
      toast.error('Error al añadir modelo: ' + error.message)
    } else {
      toast.success('Modelo añadido con éxito')
      setNewModel({ ...newModel, name: '' })
      fetchData()
    }
  }

  async function handleDeleteBrand(id: string, brandName: string) {
    if (!confirm(`¿Eliminar la marca "${brandName}"? Se borrarán en cascada todos sus modelos y compatibilidades.`)) return
    const { error } = await supabase.from('catalog_brands').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Marca eliminada')
      fetchData()
    }
  }

  async function handleDeleteModel(id: string, modelName: string) {
    if (!confirm(`¿Eliminar el modelo "${modelName}"?`)) return
    const { error } = await supabase.from('catalog_models').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Modelo eliminado')
      fetchData()
    }
  }

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  )

  const filteredModels = models.filter(m => {
    const brandMatches = selectedBrandFilter ? m.brand_id === selectedBrandFilter : true
    const searchMatches = m.name.toLowerCase().includes(modelSearch.toLowerCase())
    return brandMatches && searchMatches
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* COLUMNA 1: GESTIÓN DE MARCAS (5 cols) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-5 space-y-5">
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-subtle">
            <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue">
              <Tag size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                Marcas
              </h3>
              <p className="text-[11px] text-text-secondary">
                {brands.length} marcas registradas
              </p>
            </div>
          </div>

          {/* Formulario Nueva Marca */}
          <form onSubmit={handleAddBrand} className="flex gap-2">
            <input
              type="text"
              placeholder="Nueva Marca (Ej: MILLER)"
              className="flex-1 bg-bg-elevated border border-border-subtle focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none transition-all"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
            />
            <button
              type="submit"
              disabled={addingBrand || !newBrand.trim()}
              className="bg-electric hover:brightness-110 active:scale-[0.98] text-white px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(0,82,255,0.3)] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {addingBrand ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              <span>Añadir</span>
            </button>
          </form>

          {/* Buscador de Marcas */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Filtrar marcas..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none transition-all"
            />
          </div>

          {/* Lista de Marcas */}
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-8 text-center text-xs text-text-muted">
                <div className="w-4 h-4 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin mx-auto mb-2" />
                Cargando marcas...
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted flex flex-col items-center gap-1">
                <AlertCircle size={16} />
                <span>No se encontraron marcas.</span>
              </div>
            ) : (
              filteredBrands.map(brand => {
                const count = models.filter(m => m.brand_id === brand.id).length
                return (
                  <div
                    key={brand.id}
                    className="flex justify-between items-center bg-bg-elevated hover:bg-white/4 p-2.5 rounded-lg border border-border-subtle/60 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase text-text-primary tracking-wide">
                        {brand.name}
                      </span>
                      <span className="text-[10px] font-mono text-text-muted bg-white/4 px-1.5 py-0.5 rounded">
                        {count} mod.
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteBrand(brand.id, brand.name)}
                      className="text-text-muted hover:text-red-400 p-1 rounded transition-colors opacity-70 group-hover:opacity-100"
                      title="Eliminar marca"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* COLUMNA 2: GESTIÓN DE MODELOS (7 cols) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-subtle">
            <div className="w-8 h-8 rounded-lg bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-neon-purple">
              <Cpu size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                Modelos por Marca
              </h3>
              <p className="text-[11px] text-text-secondary">
                {models.length} modelos de motosoldadoras asociados
              </p>
            </div>
          </div>

          {/* Formulario Nuevo Modelo */}
          <form onSubmit={handleAddModel} className="space-y-2.5 bg-bg-elevated/60 border border-border-subtle/50 p-3 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-5">
                <select
                  required
                  className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-purple rounded-lg px-3 py-2 text-xs text-text-primary outline-none transition-all"
                  value={newModel.brandId}
                  onChange={(e) => setNewModel({ ...newModel, brandId: e.target.value })}
                >
                  <option value="">Seleccionar Marca *</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-7 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre de Modelo (Ej: VANTAGE 500)"
                  className="flex-1 bg-bg-elevated border border-border-subtle focus:border-neon-purple rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none transition-all"
                  value={newModel.name}
                  onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                />
                <button
                  type="submit"
                  disabled={addingModel || !newModel.brandId || !newModel.name.trim()}
                  className="bg-neon-purple hover:brightness-110 active:scale-[0.98] text-white px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(157,78,221,0.3)] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {addingModel ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          </form>

          {/* Filtros de Modelos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar modelo..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-purple rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none transition-all"
              />
            </div>

            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="bg-bg-elevated border border-border-subtle focus:border-neon-purple rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none transition-all"
            >
              <option value="">Todas las marcas ({brands.length})</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Lista de Modelos */}
          <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-8 text-center text-xs text-text-muted">
                <div className="w-4 h-4 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin mx-auto mb-2" />
                Cargando modelos...
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted flex flex-col items-center gap-1">
                <AlertCircle size={16} />
                <span>No se encontraron modelos registrados.</span>
              </div>
            ) : (
              filteredModels.map(model => {
                const brand = brands.find(b => b.id === model.brand_id)
                return (
                  <div
                    key={model.id}
                    className="flex justify-between items-center bg-bg-elevated hover:bg-white/4 p-2.5 rounded-lg border border-border-subtle/60 transition-all group"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-neon-blue uppercase tracking-wider block">
                        {brand?.name || 'SIN MARCA'}
                      </span>
                      <span className="text-xs font-semibold text-text-primary">
                        {model.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteModel(model.id, model.name)}
                      className="text-text-muted hover:text-red-400 p-1 rounded transition-colors opacity-70 group-hover:opacity-100"
                      title="Eliminar modelo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
