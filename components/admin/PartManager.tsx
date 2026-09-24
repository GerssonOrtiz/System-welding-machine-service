// components/admin/PartManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CatalogBrand, CatalogModel, Part } from '@/types/catalog'
import { toast } from 'sonner'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Search, 
  Layers, 
  CheckCircle2, 
  Tag,
  Hash,
  AlertCircle
} from 'lucide-react'

export default function PartManager() {
  const supabase: SupabaseClient<Database> = createClient()
  const [parts, setParts] = useState<Part[]>([])
  const [brands, setBrands] = useState<CatalogBrand[]>([])
  const [models, setModels] = useState<CatalogModel[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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

  async function handleAddPart(e: React.FormEvent) {
    e.preventDefault()
    if (!newPart.part_number.trim() || !newPart.name.trim()) {
      toast.error('Número de parte y nombre son obligatorios')
      return
    }

    setSubmitting(true)
    try {
      // 1. Insertar la pieza
      const { data: insertedPart, error: partError } = await supabase
        .from('parts_catalog')
        .insert([{
          part_number: newPart.part_number.trim().toUpperCase(),
          name: newPart.name.trim().toUpperCase(),
          specifications: newPart.specifications.trim() || null
        }])
        .select()
        .single()

      if (partError) {
        toast.error('Error al registrar repuesto: ' + partError.message)
        return
      }

      // 2. Insertar compatibilidades si hay modelos seleccionados
      if (newPart.compatible_models.length > 0 && insertedPart) {
        const compatibilities = newPart.compatible_models.map(modelId => ({
          part_id: insertedPart.id,
          model_id: modelId
        }))

        const { error: compError } = await supabase
          .from('part_compatibilities')
          .insert(compatibilities)

        if (compError) {
          toast.error('Repuesto creado pero hubo un error con las compatibilidades: ' + compError.message)
        }
      }

      toast.success('Repuesto registrado con éxito en el catálogo')
      setNewPart({ part_number: '', name: '', specifications: '', compatible_models: [] })
      fetchData()
    } catch {
      toast.error('Error inesperado al registrar repuesto')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeletePart(id: string, partName: string) {
    if (!confirm(`¿Eliminar el repuesto "${partName}" del catálogo?`)) return
    const { error } = await supabase.from('parts_catalog').delete().eq('id', id)
    if (error) {
      toast.error('Error al eliminar: ' + error.message)
    } else {
      toast.success('Repuesto eliminado del catálogo')
      fetchData()
    }
  }

  const filteredParts = parts.filter(p => 
    p.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.specifications && p.specifications.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* FORMULARIO DE ALTA CON ESTILO DEL SISTEMA */}
      <form onSubmit={handleAddPart} className="bg-bg-surface border border-border-subtle rounded-xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-border-subtle">
          <div className="w-8 h-8 rounded-lg bg-electric/10 border border-electric/30 flex items-center justify-center text-electric">
            <Plus size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
              Registrar Nuevo Repuesto
            </h3>
            <p className="text-[11px] text-text-secondary">
              Ingresa los datos técnicos y define la compatibilidad con modelos de motosoldadoras
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CAMPOS PRINCIPALES */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Hash size={12} className="text-neon-blue" />
                Código de Parte / N° Parte *
              </label>
              <input
                type="text"
                required
                className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-lg px-3.5 py-2.5 text-xs text-text-primary font-mono placeholder:text-text-muted transition-all outline-none"
                value={newPart.part_number}
                onChange={(e) => setNewPart({ ...newPart, part_number: e.target.value })}
                placeholder="Ej: LINC-001 / ESAB-2300"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag size={12} className="text-neon-blue" />
                Nombre del Repuesto *
              </label>
              <input
                type="text"
                required
                className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-lg px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted transition-all outline-none"
                value={newPart.name}
                onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                placeholder="Ej: TARJETA DE CONTROL PRINCIPAL"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Especificaciones Técnicas (Opcional)
              </label>
              <textarea
                className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue focus:ring-1 focus:ring-neon-blue rounded-lg px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted transition-all outline-none h-24 resize-none"
                value={newPart.specifications}
                onChange={(e) => setNewPart({ ...newPart, specifications: e.target.value })}
                placeholder="Ej: 24V DC, 4 Pines, compatible con módulo de encendido electrónico..."
              />
            </div>
          </div>

          {/* COMPATIBILIDAD CON MODELOS */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={12} className="text-neon-purple" />
                Modelos Compatibles
              </label>
              <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 px-2 py-0.5 rounded-full border border-neon-blue/20">
                {newPart.compatible_models.length} seleccionados
              </span>
            </div>

            <div className="bg-bg-elevated border border-border-subtle rounded-lg p-3 flex-1 max-h-[220px] overflow-y-auto space-y-3">
              {brands.length === 0 ? (
                <div className="text-center py-8 text-xs text-text-muted">
                  No hay marcas ni modelos registrados aún.
                </div>
              ) : (
                brands.map(brand => {
                  const brandModels = models.filter(m => m.brand_id === brand.id)
                  if (brandModels.length === 0) return null
                  return (
                    <div key={brand.id} className="space-y-1">
                      <div className="text-[10px] font-bold text-neon-blue uppercase tracking-wider px-1">
                        {brand.name}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {brandModels.map(model => {
                          const isChecked = newPart.compatible_models.includes(model.id)
                          return (
                            <label
                              key={model.id}
                              className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer border text-xs transition-all select-none ${
                                isChecked
                                  ? 'bg-electric/15 border-electric/40 text-text-primary font-medium'
                                  : 'bg-bg-surface/60 border-border-subtle/50 text-text-secondary hover:text-text-primary hover:bg-white/5'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="rounded border-border-subtle bg-bg-base text-electric focus:ring-0 w-3.5 h-3.5 accent-electric"
                                checked={isChecked}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...newPart.compatible_models, model.id]
                                    : newPart.compatible_models.filter(mid => mid !== model.id)
                                  setNewPart({ ...newPart, compatible_models: updated })
                                }}
                              />
                              <span className="truncate">{model.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* BOTÓN SUBMIT */}
        <div className="mt-5 pt-4 border-t border-border-subtle flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-electric hover:brightness-110 active:scale-[0.98] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,82,255,0.4)] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            <span>Guardar Repuesto en Catálogo</span>
          </button>
        </div>
      </form>

      {/* LISTADO DE REPUESTOS REGISTRADOS */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue">
              <Wrench size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                Repuestos Registrados
              </h3>
              <p className="text-[11px] text-text-secondary">
                {parts.length} repuestos en inventario de catálogo
              </p>
            </div>
          </div>

          {/* BUSCADOR */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted transition-all outline-none"
            />
          </div>
        </div>

        {/* TABLA DE REPUESTOS */}
        <div className="overflow-x-auto border border-border-subtle rounded-lg">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-bg-elevated border-b border-border-subtle text-text-secondary uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nombre del Repuesto</th>
                <th className="py-3 px-4">Especificaciones</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-text-muted">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
                      <span>Cargando catálogo de repuestos...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={20} className="text-text-muted" />
                      <span>No se encontraron repuestos registrados.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredParts.map(part => (
                  <tr key={part.id} className="hover:bg-white/4 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-neon-blue">
                      {part.part_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {part.name}
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-[11px] max-w-sm truncate">
                      {part.specifications || <span className="text-text-muted italic">Sin especificaciones</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeletePart(part.id, part.name)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        <Trash2 size={12} />
                        <span>Eliminar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
