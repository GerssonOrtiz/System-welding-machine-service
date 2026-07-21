'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CatalogBrand, CatalogModel } from '@/types/catalog'
import { toast } from 'sonner'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export default function BrandModelManager() {
  const supabase: SupabaseClient<Database> = createClient()
  const [brands, setBrands] = useState<CatalogBrand[]>([])
  const [models, setModels] = useState<CatalogModel[]>([])
  const [loading, setLoading] = useState(true)
  
  const [newBrand, setNewBrand] = useState('')
  const [newModel, setNewModel] = useState({ brandId: '', name: '' })

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

  async function handleAddBrand() {
    if (!newBrand) return
    const { error } = await supabase.from('catalog_brands').insert([{ name: newBrand.toUpperCase() }])
    if (error) {
      toast.error('Error al añadir marca: ' + error.message)
    } else {
      toast.success('Marca añadida')
      setNewBrand('')
      fetchData()
    }
  }

  async function handleAddModel() {
    if (!newModel.brandId || !newModel.name) return
    const { error } = await supabase.from('catalog_models').insert([{ 
      brand_id: newModel.brandId, 
      name: newModel.name.toUpperCase() 
    }])
    if (error) {
      toast.error('Error al añadir modelo: ' + error.message)
    } else {
      toast.success('Modelo añadido')
      setNewModel({ ...newModel, name: '' })
      fetchData()
    }
  }

  async function handleDeleteBrand(id: string) {
    if (!confirm('¿Eliminar esta marca? Se borrarán todos sus modelos asociados.')) return
    const { error } = await supabase.from('catalog_brands').delete().eq('id', id)
    if (error) toast.error(error.message)
    else fetchData()
  }

  async function handleDeleteModel(id: string) {
    const { error } = await supabase.from('catalog_models').delete().eq('id', id)
    if (error) toast.error(error.message)
    else fetchData()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
      {/* SECCIÓN MARCAS */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <h3 className="text-xl font-bold text-cyan-400 mb-4">Gestión de Marcas</h3>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Nueva Marca (Ej: LINCOLN)"
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
          />
          <button
            onClick={handleAddBrand}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded transition-colors"
          >
            Añadir
          </button>
        </div>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {brands.map(brand => (
            <div key={brand.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded border border-slate-700/50">
              <span className="font-medium">{brand.name}</span>
              <button 
                onClick={() => handleDeleteBrand(brand.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN MODELOS */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <h3 className="text-xl font-bold text-indigo-400 mb-4">Gestión de Modelos</h3>
        <div className="space-y-3 mb-6">
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none"
            value={newModel.brandId}
            onChange={(e) => setNewModel({ ...newModel, brandId: e.target.value })}
          >
            <option value="">Seleccionar Marca</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nuevo Modelo (Ej: VANTAGE 500)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              value={newModel.name}
              onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
            />
            <button
              onClick={handleAddModel}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded transition-colors"
            >
              Añadir
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {models.map(model => {
            const brand = brands.find(b => b.id === model.brand_id)
            return (
              <div key={model.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded border border-slate-700/50">
                <div>
                  <span className="text-xs text-slate-400 block">{brand?.name}</span>
                  <span className="font-medium">{model.name}</span>
                </div>
                <button 
                  onClick={() => handleDeleteModel(model.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Eliminar
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
