// components/equipment/EquipmentForm.tsx
'use client'

import React, { useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createEquipmentSchema, CreateEquipmentInput } from '@/lib/validations/equipment.schema'
import ClientSelector from './ClientSelector'
import BrandSelector from './BrandSelector'
import ModelSelector from './ModelSelector'

interface EquipmentFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function EquipmentForm({ onSuccess, onCancel }: EquipmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateEquipmentInput>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: {
      fr_number: '',
      client_name: '',
      service_type: 'REVISION_GENERAL',
      brand: '',
      model: '',
      serial_number: '',
      client_report: '',
      accessories: '',
      condition_in: '',
      additional_observations: '',
      priority_level: 0,
    },
  })

  const selectedBrand = useWatch({
    control,
    name: 'brand',
  })

  const BRANDS = ["ESAB", "MILLER", "LINCOLN ELECTRIC", "DAF", "KENDE", "HYPERTHERM"]

  const onSubmit = async (data: CreateEquipmentInput) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/equipment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const resData = await response.json()

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Ocurrió un error al registrar el equipo')
      }

      toast.success('Equipo registrado con éxito')
      reset()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al registrar equipo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-6 font-sans text-text-primary"
      autoComplete="off"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Ficha de Recepción + Prioridad */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Ficha de Recepción (FR) *
            </label>
            <div className="flex items-center gap-2">
              <select
                {...register('priority_level', { valueAsNumber: true })}
                className="text-[10px] font-bold bg-bg-elevated border border-neon-purple/20 rounded-md px-2 py-1 text-neon-purple uppercase outline-none focus:border-neon-purple transition-all cursor-pointer"
              >
                <option value={0}>Regular</option>
                <option value={1}>⭐ VIP 1</option>
                <option value={2}>⭐⭐ VIP 2</option>
                <option value={3}>⭐⭐⭐ VIP 3</option>
              </select>
            </div>
          </div>
          <input
            type="text"
            {...register('fr_number')}
            placeholder="ej: 1199-1"
            className={`w-full bg-bg-elevated border ${
              errors.fr_number ? 'border-red-500/50 focus:shadow-[0_0_8px_rgba(239,68,68,0.2)]' : 'border-border-subtle focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,229,255,0.2)]'
            } rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-all font-mono`}
            autoComplete="off"
          />
          {errors.fr_number && (
            <p className="text-red-400 text-xs mt-1">{errors.fr_number.message}</p>
          )}
        </div>

        {/* Cliente */}
        <div className="space-y-1">
          <Controller
            name="client_name"
            control={control}
            render={({ field }) => (
              <ClientSelector
                value={field.value}
                onChange={field.onChange}
                error={errors.client_name?.message}
                label="Nombre del Cliente *"
              />
            )}
          />
        </div>

        {/* Tipo de Servicio */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Tipo de Servicio *
          </label>
          <select
            {...register('service_type')}
            className={`w-full bg-bg-elevated border ${
              errors.service_type ? 'border-red-500/50' : 'border-border-subtle focus:border-neon-blue'
            } rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all`}
          >
            <option value="GARANTIA_CABELAB">GARANTÍA CABELAB</option>
            <option value="GARANTIA_ESAB">GARANTÍA ESAB</option>
            <option value="REVISION_GENERAL">REVISIÓN GENERAL</option>
          </select>
          {errors.service_type && (
            <p className="text-red-400 text-xs mt-1">{errors.service_type.message}</p>
          )}
        </div>

        {/* Marca */}
        <div className="space-y-1">
          <Controller
            name="brand"
            control={control}
            render={({ field }) => (
              <BrandSelector
                value={field.value || ''}
                onChange={field.onChange}
                error={errors.brand?.message}
                label="Marca"
              />
            )}
          />
        </div>

        {/* Modelo */}
        <div className="space-y-1">
          <Controller
            name="model"
            control={control}
            render={({ field }) => (
              <ModelSelector
                value={field.value || ''}
                onChange={field.onChange}
                brand={selectedBrand || undefined}
                error={errors.model?.message}
                label="Modelo"
              />
            )}
          />
        </div>

        {/* Número de Serie */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Número de Serie
          </label>
          <input
            type="text"
            {...register('serial_number')}
            placeholder="ej: SN-123456 (opcional)"
            className={`w-full bg-bg-elevated border ${
              errors.serial_number ? 'border-red-500/50' : 'border-border-subtle focus:border-neon-blue'
            } rounded-lg px-3.5 py-2.5 text-sm focus:outline-none transition-all font-mono`}
            autoComplete="off"
          />
          {errors.serial_number && (
            <p className="text-red-400 text-xs mt-1">{errors.serial_number.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Reporte del cliente */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Reporte del cliente / Falla
          </label>
          <textarea
            {...register('client_report')}
            placeholder="ej: NO ENCIENDE AL PRIMER INTENTO"
            rows={3}
            className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all resize-none"
            autoComplete="off"
          />
        </div>

        {/* Accesorios */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Accesorios incluidos
          </label>
          <textarea
            {...register('accessories')}
            placeholder="ej: CABLE DE TIERRA, CARETA"
            rows={3}
            className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all resize-none"
            autoComplete="off"
          />
        </div>

        {/* Condición de ingreso */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Condición física de ingreso
          </label>
          <textarea
            {...register('condition_in')}
            placeholder="ej: GOLPE EN PANEL LATERAL"
            rows={3}
            className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all resize-none"
            autoComplete="off"
          />
        </div>

        {/* Observaciones adicionales */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Observaciones adicionales
          </label>
          <textarea
            {...register('additional_observations')}
            placeholder="ej: CLIENTE INDICA QUE EL PROBLEMA ES RECIENTE"
            rows={3}
            className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3.5 py-2 text-sm focus:outline-none transition-all resize-none"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-semibold border border-neon-blue text-neon-blue rounded-lg hover:bg-neon-blue/10 transition-all uppercase"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-electric text-white shadow-neon-blue hover:brightness-110 transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Registrando...' : 'Registrar Equipo'}
        </button>
      </div>
    </form>
  )
}
