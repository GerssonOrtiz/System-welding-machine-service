'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CatalogBrand, CatalogModel, Part } from '@/types/catalog'
import { toast } from 'sonner'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

export default function PartManager() {
  const supabase: SupabaseClient<Database> = createClient()
  const [parts, setParts] = useState<Part[]>([])
  const [brands, setBrands] = useState<CatalogBrand[]>([])
  const [models, setModels] = useState<CatalogModel[]>([])
  const [loading, setLoading] = useState(true)

  const [newPart, setNewPart] = useState({
    part_number: '',
    name: '',
    specifications: '',
    compatible_models: [] as string[]
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: partsData } = await supabase.from('parts_catalog').select('*').order('name')
    const { data: brandsData } = await supabase.from('catalog_brands').select('*').order('name')
    const { data: modelsData } = await supabase.from('catalog_models').select('*').order('name')
    
    setParts(partsData || [])
    setBrands(brandsData || [])
    setModels(modelsData || [])
    setLoading(false)
  }

  async function handleAddPart() {
    if (!newPart.part_number || !newPart.name) {
      toast.error('Número de parte y nombre son obligatorios')
      return
    }

    // 1. Insertar la pieza
    const { data: insertedPart, error: partError } = await supabase
      .from('parts_catalog')
      .insert([{
        part_number: newPart.part_number.toUpperCase(),
        name: newPart.name.toUpperCase(),
        specifications: newPart.specifications
      }])
      .select()
      .single()

    if (partError) {
      toast.error('Error al añadir pieza: ' + partError.message)
      return
    }

    // 2. Insertar compatibilidades si hay modelos seleccionados
    if (newPart.compatible_models.length > 0) {
      const compatibilities = newPart.compatible_models.map(modelId => ({
        part_id: insertedPart.id,
        model_id: modelId
      }))

      const { error: compError } = await supabase
        .from('part_compatibilities')
        .insert(compatibilities)

      if (compError) {
        toast.error('Pieza añadida pero error en compatibilidades: ' + compError.message)
      }
    }

    toast.success('Repuesto registrado con éxito')
    setNewPart({ part_number: '', name: '', specifications: '', compatible_models: [] })
    fetchData()
  }

  async function handleDeletePart(id: string) {
    if (!confirm('¿Eliminar este repuesto del catálogo?')) return
    const { error } = await supabase.from('parts_catalog').delete().eq('id', id)
    if (error) toast.error(error.message)
    else fetchData()
  }

  return (
    <div className="space-y-8 p-4">
      {/* FORMULARIO DE ALTA */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <h3 className="text-xl font-bold text-emerald-400 mb-6">Registrar Nuevo Repuesto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Código de Parte / Nro Parte</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                value={newPart.part_number}
                onChange={(e) => setNewPart({ ...newPart, part_number: e.target.value })}
                placeholder="Ej: LINC-001"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nombre del Repuesto</label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                value={newPart.name}
                onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                placeholder="Ej: TARJETA DE CONTROL"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Especificaciones (Opcional)</label>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 h-24"
                value={newPart.specifications}
                onChange={(e) => setNewPart({ ...newPart, specifications: e.target.value })}
                placeholder="Ej: 24V DC, 4 Pines..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Modelos Compatibles (Selección múltiple)</label>
            <div className="bg-slate-800 border border-slate-700 rounded p-3 h-[210px] overflow-y-auto space-y-1">
              {brands.map(brand => (
                <div key={brand.id}>
                  <div className="text-xs font-bold text-slate-500 uppercase mt-2 mb-1 px-1">{brand.name}</div>
                  {models.filter(m => m.brand_id === brand.id).map(model => (
                    <label key={model.id} className="flex items-center gap-2 hover:bg-slate-700/50 p-1 rounded cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                        checked={newPart.compatible_models.includes(model.id)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...newPart.compatible_models, model.id]
                            : newPart.compatible_models.filter(mid => mid !== model.id)
                          setNewPart({ ...newPart, compatible_models: updated })
                        }}
                      />
                      <span className="text-sm">{model.name}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleAddPart}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2 rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20"
          >
            Guardar Repuesto en Catálogo
          </button>
        </div>
      </div>

      {/* LISTADO DE REPUESTOS */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
        <h3 className="text-xl font-bold text-slate-300 mb-4">Catálogo de Repuestos Registrados</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-sm">
                <th className="pb-3 pl-2">Código</th>
                <th className="pb-3">Nombre</th>
                <th className="pb-3">Especificaciones</th>
                <th className="pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {parts.map(part => (
                <tr key={part.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 pl-2 font-mono text-emerald-400">{part.part_number}</td>
                  <td className="py-3 font-medium">{part.name}</td>
                  <td className="py-3 text-slate-400 text-sm max-w-xs truncate">{part.specifications || '-'}</td>
                  <td className="py-3">
                    <button 
                      onClick={() => handleDeletePart(part.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {parts.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">No hay repuestos registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
