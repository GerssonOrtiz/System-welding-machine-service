// components/admin/TechnicianManager.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Technician {
  id: number
  name: string
  is_active: boolean
}

export default function TechnicianManager() {
  const [techs, setTechs] = useState<Technician[]>([])
  const [newName, setNewName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  const fetchTechs = async () => {
    try {
      const res = await fetch('/api/admin/technicians')
      const data = await res.json()
      if (data.success) setTechs(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTechs()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setIsAdding(true)
    try {
      const res = await fetch('/api/admin/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Personal añadido correctamente')
        setNewName('')
        fetchTechs()
      } else {
        toast.error(data.error)
      }
    } catch (err) {
      toast.error('Error al añadir personal')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar a este personal? Si tiene equipos asociados, será desactivado en su lugar.')) return
    try {
      const res = await fetch(`/api/admin/technicians/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Operación realizada con éxito')
        fetchTechs()
      }
    } catch (err) {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-6">
      <h2 className="text-lg font-bold text-neon-blue uppercase tracking-wider flex items-center gap-2">
        👤 Gestión de Personal Técnico
      </h2>

      {/* Formulario de Adición */}
      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del técnico o practicante..."
          className="flex-1 bg-bg-elevated border border-border-subtle rounded-lg px-4 py-2 text-sm focus:border-neon-blue outline-none transition-all uppercase"
          disabled={isAdding}
        />
        <button
          type="submit"
          disabled={isAdding || !newName.trim()}
          className="bg-neon-blue text-black font-bold px-6 py-2 rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-50"
        >
          {isAdding ? 'Añadiendo...' : 'AÑADIR'}
        </button>
      </form>

      {/* Lista de Técnicos */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-xs text-text-muted animate-pulse">Cargando personal...</div>
        ) : techs.length === 0 ? (
          <div className="text-xs text-text-muted italic">No hay personal registrado.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {techs.map((t) => (
              <div 
                key={t.id} 
                className={`flex justify-between items-center p-3 rounded-lg border ${
                  t.is_active ? 'bg-bg-base border-border-subtle' : 'bg-red-500/5 border-red-500/20 opacity-60'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary uppercase">{t.name}</span>
                  <span className="text-[9px] text-text-muted uppercase">{t.is_active ? 'Activo' : 'Inactivo'}</span>
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                  title="Eliminar o Desactivar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
