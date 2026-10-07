'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Copy, Layers, ChevronDown, ChevronUp, Wrench } from 'lucide-react'
import ClientSelector from './ClientSelector'
import BrandSelector from './BrandSelector'
import ModelSelector from './ModelSelector'

export interface EquipmentItemState {
  id: string // Identificador local de la UI
  fr_number: string
  service_type: 'GARANTIA_CABELAB' | 'GARANTIA_ESAB' | 'REVISION_GENERAL'
  brand: string
  model: string
  serial_number: string
  priority_level: number
  client_report: string
  accessories: string
  additional_observations: string
}

interface EquipmentFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

function createEmptyEquipmentItem(index: number, defaultServiceType: 'GARANTIA_CABELAB' | 'GARANTIA_ESAB' | 'REVISION_GENERAL'): EquipmentItemState {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    fr_number: '',
    service_type: defaultServiceType,
    brand: '',
    model: '',
    serial_number: '',
    priority_level: 0,
    client_report: '',
    accessories: '',
    additional_observations: '',
  }
}

export default function EquipmentForm({ onSuccess, onCancel }: EquipmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientName, setClientName] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)
  const [defaultServiceType, setDefaultServiceType] = useState<'GARANTIA_CABELAB' | 'GARANTIA_ESAB' | 'REVISION_GENERAL'>('REVISION_GENERAL')

  const [equipments, setEquipments] = useState<EquipmentItemState[]>([
    createEmptyEquipmentItem(0, 'REVISION_GENERAL'),
  ])

  // Track de qué tarjeta está expandida para detalles opcionales (reporte/accesorios)
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({})

  const toggleDetails = (id: string) => {
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleUpdateItem = (id: string, field: keyof EquipmentItemState, value: any) => {
    setEquipments(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          // Si cambia la marca, resetear el modelo si no coincide
          if (field === 'brand' && item.brand !== value) {
            updated.model = ''
          }
          return updated
        }
        return item
      })
    )
  }

  const handleAddEquipment = () => {
    // Si ya hay uno anterior, heredar opcionalmente marca y tipo de servicio
    const last = equipments[equipments.length - 1]
    const newItem = createEmptyEquipmentItem(equipments.length, defaultServiceType)
    if (last) {
      newItem.brand = last.brand
      newItem.service_type = last.service_type
    }
    setEquipments(prev => [...prev, newItem])
  }

  const handleDuplicateItem = (itemToClone: EquipmentItemState) => {
    const newItem: EquipmentItemState = {
      ...itemToClone,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fr_number: '', // El nuevo equipo requiere su propio FR
      serial_number: '',
    }
    setEquipments(prev => [...prev, newItem])
    toast.info('Se duplicaron los datos del equipo. Por favor, ingresa el nuevo FR.')
  }

  const handleRemoveEquipment = (id: string) => {
    if (equipments.length === 1) {
      toast.warning('Debe haber al menos un equipo en el ingreso.')
      return
    }
    setEquipments(prev => prev.filter(item => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Validar cliente
    if (!clientName.trim()) {
      setClientError('El nombre del cliente es obligatorio')
      toast.error('Por favor, ingresa el nombre del cliente')
      return
    }
    setClientError(null)

    // 2. Validar cada equipo
    for (let i = 0; i < equipments.length; i++) {
      const eq = equipments[i]
      if (!eq.fr_number.trim()) {
        toast.error(`El Equipo #${i + 1} no tiene Ficha de Recepción (FR)`)
        return
      }
    }

    // 3. Validar FRs duplicados internamente
    const frSet = new Set<string>()
    for (const eq of equipments) {
      const upper = eq.fr_number.trim().toUpperCase()
      if (frSet.has(upper)) {
        toast.error(`El FR "${upper}" está repetido en la lista. Cada equipo debe tener un FR único.`)
        return
      }
      frSet.add(upper)
    }

    setIsSubmitting(true)

    try {
      const payload = {
        client_name: clientName.trim(),
        equipments: equipments.map(eq => ({
          fr_number: eq.fr_number.trim(),
          service_type: eq.service_type,
          brand: eq.brand.trim() || 'S/M',
          model: eq.model.trim() || 'S/M',
          serial_number: eq.serial_number.trim() || 'N/S',
          priority_level: eq.priority_level,
          client_report: eq.client_report.trim() || null,
          accessories: eq.accessories.trim() || null,
          additional_observations: eq.additional_observations.trim() || null,
        })),
      }

      const response = await fetch('/api/equipment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const resData = await response.json()

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Ocurrió un error al registrar el equipo')
      }

      const totalCreated = resData.data?.total || equipments.length
      toast.success(
        totalCreated > 1
          ? `¡Lote de ${totalCreated} equipos registrado y notificado en un solo correo!`
          : 'Equipo registrado y notificado con éxito'
      )

      if (resData.warning) {
        toast.warning(`Aviso de notificación: ${resData.warning}`)
      }

      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al registrar los equipos')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isMultiple = equipments.length > 1

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans text-text-primary" autoComplete="off">
      {/* ── CABECERA GENERAL DEL INGRESO (CLIENTE & SERVICIO GENERAL) ── */}
      <div className="bg-bg-elevated/40 border border-border-subtle rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="text-neon-blue" size={18} />
            <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Información General del Ingreso
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neon-blue/10 text-neon-blue border border-neon-blue/20">
            {equipments.length} {equipments.length === 1 ? 'equipo a ingresar' : 'equipos en este lote'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cliente */}
          <div className="space-y-1">
            <ClientSelector
              value={clientName}
              onChange={(val) => {
                setClientName(val)
                if (clientError) setClientError(null)
              }}
              error={clientError || undefined}
              label="Nombre del Cliente *"
            />
          </div>

          {/* Tipo de Servicio Predeterminado */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Tipo de Servicio Principal
            </label>
            <select
              value={defaultServiceType}
              onChange={(e) => {
                const val = e.target.value as any
                setDefaultServiceType(val)
                // Si solo hay un equipo, actualizarlo inmediatamente
                if (equipments.length === 1) {
                  handleUpdateItem(equipments[0].id, 'service_type', val)
                }
              }}
              className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all text-text-primary"
            >
              <option value="REVISION_GENERAL">REVISIÓN GENERAL</option>
              <option value="GARANTIA_CABELAB">GARANTÍA CABELAB</option>
              <option value="GARANTIA_ESAB">GARANTÍA ESAB</option>
            </select>
            <p className="text-[10px] text-text-muted mt-0.5">
              Aplica por defecto a los equipos agregados. Puedes personalizar cada uno abajo.
            </p>
          </div>
        </div>
      </div>

      {/* ── LISTA MODULAR DE EQUIPOS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-2">
            <Wrench size={14} /> Detalle de Equipos ({equipments.length})
          </label>
          <button
            type="button"
            onClick={handleAddEquipment}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neon-blue/15 hover:bg-neon-blue/25 text-neon-blue border border-neon-blue/30 transition-all shadow-sm active:scale-95"
          >
            <Plus size={14} />
            <span>Agregar otro equipo</span>
          </button>
        </div>

        <div className="space-y-3.5">
          {equipments.map((eq, index) => {
            const isExpanded = !!expandedDetails[eq.id]

            return (
              <div
                key={eq.id}
                className="bg-bg-surface border border-border-subtle hover:border-neon-blue/40 rounded-xl p-4 sm:p-5 transition-all shadow-sm space-y-4 relative"
              >
                {/* Cabecera de la tarjeta del equipo */}
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle/40">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neon-blue/20 text-neon-blue text-xs font-bold font-mono">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold uppercase text-text-secondary tracking-wider">
                      Equipo {index + 1}
                      {eq.fr_number.trim() && (
                        <span className="text-text-primary font-mono ml-1.5 text-xs text-neon-blue font-bold">
                          [{eq.fr_number.toUpperCase()}]
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botón Duplicar datos */}
                    <button
                      type="button"
                      title="Duplicar marca y servicio en nuevo equipo"
                      onClick={() => handleDuplicateItem(eq)}
                      className="p-1.5 text-text-muted hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all"
                    >
                      <Copy size={14} />
                    </button>

                    {/* Botón Eliminar si hay más de 1 */}
                    {equipments.length > 1 && (
                      <button
                        type="button"
                        title="Eliminar este equipo"
                        onClick={() => handleRemoveEquipment(eq.id)}
                        className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Campos principales en Grid limpio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* FR Number + Prioridad */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        Ficha FR *
                      </label>
                      <select
                        value={eq.priority_level}
                        onChange={(e) => handleUpdateItem(eq.id, 'priority_level', parseInt(e.target.value, 10))}
                        className="text-[10px] font-bold bg-bg-elevated border border-neon-purple/20 rounded px-1.5 py-0.5 text-neon-purple uppercase outline-none focus:border-neon-purple cursor-pointer"
                      >
                        <option value={0}>Regular</option>
                        <option value={1}>⭐ VIP 1</option>
                        <option value={2}>⭐⭐ VIP 2</option>
                        <option value={3}>⭐⭐⭐ VIP 3</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={eq.fr_number}
                      onChange={(e) => handleUpdateItem(eq.id, 'fr_number', e.target.value)}
                      placeholder="ej: 1201-1"
                      className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-all font-mono"
                      required
                    />
                  </div>

                  {/* Marca */}
                  <div className="space-y-1">
                    <BrandSelector
                      value={eq.brand}
                      onChange={(val) => handleUpdateItem(eq.id, 'brand', val)}
                      label="Marca"
                    />
                  </div>

                  {/* Modelo */}
                  <div className="space-y-1">
                    <ModelSelector
                      value={eq.model}
                      onChange={(val) => handleUpdateItem(eq.id, 'model', val)}
                      brand={eq.brand || undefined}
                      label="Modelo"
                    />
                  </div>

                  {/* Número de Serie */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      N° de Serie
                    </label>
                    <input
                      type="text"
                      value={eq.serial_number}
                      onChange={(e) => handleUpdateItem(eq.id, 'serial_number', e.target.value)}
                      placeholder="ej: SN-12345 (opcional)"
                      className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3 py-2 text-sm focus:outline-none transition-all font-mono"
                    />
                  </div>

                  {/* Tipo de Servicio específico de este equipo */}
                  <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                      Tipo de Servicio
                    </label>
                    <select
                      value={eq.service_type}
                      onChange={(e) => handleUpdateItem(eq.id, 'service_type', e.target.value as any)}
                      className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3 py-2 text-sm focus:outline-none transition-all"
                    >
                      <option value="REVISION_GENERAL">REVISIÓN GENERAL</option>
                      <option value="GARANTIA_CABELAB">GARANTÍA CABELAB</option>
                      <option value="GARANTIA_ESAB">GARANTÍA ESAB</option>
                    </select>
                  </div>
                </div>

                {/* Sección desplegable: Detalles opcionales (falla, accesorios, notas) */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggleDetails(eq.id)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted hover:text-neon-blue transition-colors select-none py-1"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{isExpanded ? 'Ocultar reporte de falla y accesorios' : '+ Agregar reporte de falla, accesorios u observaciones'}</span>
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3 pt-3 border-t border-border-subtle/30 animate-in fade-in duration-150">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                          Reporte del cliente / Falla
                        </label>
                        <textarea
                          value={eq.client_report}
                          onChange={(e) => handleUpdateItem(eq.id, 'client_report', e.target.value)}
                          placeholder="ej: NO ENCIENDE, PRESENTA ALARMA DE TEMPERATURA"
                          rows={2}
                          className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-all resize-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                          Accesorios incluidos
                        </label>
                        <textarea
                          value={eq.accessories}
                          onChange={(e) => handleUpdateItem(eq.id, 'accessories', e.target.value)}
                          placeholder="ej: CABLES, ANTORCHA, ADAPTADOR"
                          rows={2}
                          className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-all resize-none"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                          Observaciones adicionales
                        </label>
                        <input
                          type="text"
                          value={eq.additional_observations}
                          onChange={(e) => handleUpdateItem(eq.id, 'additional_observations', e.target.value)}
                          placeholder="ej: INGRESA CON GOLPE EN CARCASA DERECHA"
                          className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── BOTONES DE ACCIÓN ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border-subtle">
        <button
          type="button"
          onClick={handleAddEquipment}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/10 transition-all uppercase tracking-wider"
        >
          <Plus size={14} />
          <span>+ Agregar otro equipo a este cliente</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-xs font-bold border border-border-subtle text-text-secondary rounded-lg hover:bg-bg-elevated transition-all uppercase tracking-wider"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-7 py-2.5 text-xs font-bold rounded-lg bg-electric text-white shadow-neon-blue hover:brightness-110 transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Registrando...'
              : isMultiple
              ? `Registrar Lote (${equipments.length} Equipos)`
              : 'Registrar Equipo'}
          </button>
        </div>
      </div>
    </form>
  )
}