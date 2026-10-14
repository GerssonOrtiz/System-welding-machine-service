// components/admin/HolidayCalendarManager.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Plus, Trash2, CalendarDays, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export interface HolidayItem {
  id: string
  holiday_date: string
  reason: string
  created_at?: string
}

export default function HolidayCalendarManager() {
  const [holidays, setHolidays] = useState<HolidayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Campos para nuevo feriado
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')

  const fetchHolidays = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/calendar/holidays')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setHolidays(json.data)
      } else {
        toast.error(json.error || 'Error al cargar días no hábiles')
      }
    } catch {
      toast.error('Error de red al cargar feriados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHolidays()
  }, [])

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDate) {
      toast.error('Seleccione una fecha')
      return
    }
    if (!newReason.trim()) {
      toast.error('Ingrese el motivo o descripción')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/calendar/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holiday_date: newDate,
          reason: newReason.trim(),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Día no hábil agregado correctamente')
        setNewDate('')
        setNewReason('')
        fetchHolidays()
      } else {
        toast.error(json.error || 'No se pudo agregar el día no hábil')
      }
    } catch {
      toast.error('Error de red al guardar el día no hábil')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteHoliday = async (id: string) => {
    try {
      setDeletingId(id)
      const res = await fetch(`/api/calendar/holidays/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Día no hábil eliminado')
        setHolidays((prev) => prev.filter((h) => h.id !== id))
      } else {
        toast.error(json.error || 'No se pudo eliminar el día no hábil')
      }
    } catch {
      toast.error('Error de red al eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  // Formatear fecha legible
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-'
    const [year, month, day] = dateStr.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('es-PE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 shadow-sm space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h2 className="text-base font-bold text-text-primary uppercase tracking-wide flex items-center gap-2">
            <CalendarDays size={18} className="text-neon-blue" />
            Días No Hábiles y Feriados de Planta
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Los días registrados aquí serán excluidos automáticamente por la Calculadora de Entrega Predictiva al computar días hábiles.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-md font-bold self-start sm:self-auto">
          {holidays.length} días configurados
        </span>
      </div>

      {/* Formulario para agregar día no hábil */}
      <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-bg-elevated/40 p-4 rounded-lg border border-border-subtle">
        <div className="sm:col-span-4 space-y-1">
          <label className="text-[11px] font-bold text-text-secondary uppercase block">
            Fecha No Laboral
          </label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            disabled={saving}
            className="w-full bg-bg-base border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue h-[38px]"
            required
          />
        </div>

        <div className="sm:col-span-5 space-y-1">
          <label className="text-[11px] font-bold text-text-secondary uppercase block">
            Motivo / Celebración / Mantenimiento
          </label>
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            disabled={saving}
            placeholder="ej. Feriado Nacional, Parada de Planta, etc."
            className="w-full bg-bg-base border border-border-subtle rounded px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-neon-blue h-[38px]"
            required
          />
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-[38px] flex items-center justify-center gap-1.5 bg-neon-blue/15 hover:bg-neon-blue/25 border border-neon-blue/40 text-neon-blue rounded text-xs font-bold uppercase transition-all disabled:opacity-50"
          >
            <Plus size={14} />
            {saving ? 'Guardando...' : 'Agregar Feriado'}
          </button>
        </div>
      </form>

      {/* Listado de feriados */}
      {loading ? (
        <div className="py-8 text-center text-xs text-neon-blue font-mono animate-pulse">
          Cargando calendario de días no hábiles...
        </div>
      ) : holidays.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-border-subtle rounded-lg p-6 space-y-2">
          <Calendar size={24} className="mx-auto text-text-muted" />
          <p className="text-xs text-text-secondary font-medium">
            No hay días no hábiles adicionales configurados.
          </p>
          <p className="text-[11px] text-text-muted">
            Por defecto, el sistema excluye únicamente sábados y domingos. Puedes añadir feriados específicos arriba.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-elevated/80 text-[10px] uppercase font-bold text-text-secondary tracking-wider border-b border-border-subtle">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Día</th>
                <th className="px-4 py-3">Motivo / Descripción</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 font-mono">
              {holidays.map((item) => (
                <tr key={item.id} className="hover:bg-bg-elevated/40 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-neon-blue">
                    {item.holiday_date}
                  </td>
                  <td className="px-4 py-2.5 font-sans capitalize text-text-primary text-[11px]">
                    {formatDateDisplay(item.holiday_date)}
                  </td>
                  <td className="px-4 py-2.5 font-sans text-text-secondary text-xs">
                    {item.reason}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteHoliday(item.id)}
                      disabled={deletingId === item.id}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Eliminar día no hábil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-start gap-2 text-[11px] text-text-muted bg-bg-elevated/30 p-3 rounded-lg border border-border-subtle/60">
        <AlertCircle size={14} className="text-neon-blue shrink-0 mt-0.5" />
        <span>
          Cualquier cambio realizado en esta lista se refleja inmediatamente en la calculadora predictiva para todos los roles del taller.
        </span>
      </div>
    </div>
  )
}
