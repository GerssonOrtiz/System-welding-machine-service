'use client'

import React, { useState, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import { useEquipmentList } from '@/hooks/useEquipmentList'
import { useUser } from '@/hooks/useUser'
import { useRealtimePizarra } from '@/hooks/useRealtimePizarra'
import EquipmentTable from '@/components/equipment/EquipmentTable'
import EquipmentForm from '@/components/equipment/EquipmentForm'

export default function EquiposPage() {
  const { role } = useUser()
  const [currentPage, setCurrentPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const includeDelivered = role === 'visualizador'
  const { equipments, total, totalPages, isLoading, mutate } = useEquipmentList(currentPage, includeDelivered, statusFilter || undefined, serviceFilter || undefined)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Realtime subscription
  useRealtimePizarra(mutate)

  const canRegister = ['superadmin', 'admin', 'recepcion'].includes(role || '')

  // Búsqueda con debounce de 350ms
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)

    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null)
      return
    }

    searchTimer.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/equipment/search?q=${encodeURIComponent(searchQuery.trim())}&include_delivered=${includeDelivered}`)
        const data = await res.json()
        if (data.success) {
          setSearchResults(data.data.results || [])
        } else {
          setSearchResults([])
        }
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [searchQuery, includeDelivered])

  const handleDeleteAll = async () => {
    const confirmText = window.prompt(
      '¿Está seguro de que desea eliminar permanentemente TODOS los equipos de la base de datos?\nEsta acción es irreversible y borrará el historial de estados de todos los equipos.\n\nPara confirmar, escriba "ELIMINAR" en la casilla de abajo:'
    )

    if (confirmText !== 'ELIMINAR') {
      if (confirmText !== null) {
        toast.error('Confirmación incorrecta. No se eliminaron los equipos.')
      }
      return
    }

    setIsDeletingAll(true)
    try {
      const res = await fetch('/api/equipment', { method: 'DELETE' })
      const resData = await res.json()
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Ocurrió un error al eliminar los equipos')
      }
      toast.success('Se han eliminado todos los equipos con éxito')
      setSearchQuery('')
      setSearchResults(null)
      mutate()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al eliminar todos los equipos')
    } finally {
      setIsDeletingAll(false)
    }
  }

  const getPageTitle = () => {
    if (role === 'recepcion') return '📥 Módulo de Recepción — Equipos Relevantes'
    if (role === 'almacen') return '📦 Módulo de Almacén — Equipos en Espera de Repuestos'
    if (role === 'visualizador') return '📋 Consulta General de Equipos'
    return '📋 Lista de Equipos Activos'
  }

  const getPageDescription = () => {
    if (role === 'recepcion') return 'Registro de nuevos ingresos y entrega de motosoldadoras culminadas.'
    if (role === 'almacen') return 'Bandeja de equipos pendientes de entrega de repuestos técnicos.'
    if (role === 'visualizador') return 'Búsqueda e historial completo de todos los equipos del sistema.'
    return 'Seguimiento completo de todos los equipos en proceso activo.'
  }

  // Determina qué lista mostrar en la tabla
  const displayEquipments = searchResults !== null ? searchResults : equipments
  const displayTotal = searchResults !== null ? searchResults.length : total
  const isInSearchMode = searchResults !== null
  const showLoader = isSearching || (isLoading && !isInSearchMode)

  return (
    <div className="space-y-5 font-sans text-text-primary p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neon-blue tracking-wider uppercase">{getPageTitle()}</h1>
          <p className="text-text-secondary text-xs mt-1">{getPageDescription()}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {role === 'superadmin' && (
            <button
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-extrabold uppercase tracking-wider transition-all disabled:opacity-40 select-none shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
              {isDeletingAll ? '🔴 Eliminando...' : '🔴 Eliminar Todo'}
            </button>
          )}
          {['superadmin', 'admin'].includes(role || '') && (
            <div className="flex gap-2">
              <a
                href="/api/equipment/export?format=xlsx"
                download
                className="bg-bg-surface hover:bg-bg-surface/85 border border-border-subtle hover:border-neon-blue text-text-primary text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2.5 rounded-lg transition-all inline-block select-none"
              >
                📤 Exportar Excel
              </a>
              <a
                href="/api/equipment/export?format=csv"
                download
                className="bg-bg-surface hover:bg-bg-surface/85 border border-border-subtle hover:border-neon-blue text-text-primary text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2.5 rounded-lg transition-all inline-block select-none"
              >
                📄 CSV
              </a>
            </div>
          )}

          {canRegister && (
            <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
              <Dialog.Trigger asChild>
                <button className="px-5 py-2.5 rounded-lg bg-electric text-white text-xs font-bold uppercase hover:shadow-neon-blue hover:brightness-110 transition-all select-none">
                  ➕ Registrar nuevo equipo
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-bg-base/85 backdrop-blur-sm z-50 transition-opacity" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[750px] max-h-[90vh] overflow-y-auto bg-bg-surface border border-neon-blue/30 rounded-xl shadow-neon-blue p-6 md:p-8 z-50 text-text-primary animate-in fade-in zoom-in-95 duration-150 scrollbar-thin">
                  <Dialog.Title className="text-lg font-bold text-neon-blue mb-6 border-b border-border-subtle pb-2 uppercase tracking-wider">
                    📥 Registrar Nuevo Ingreso de Equipo
                  </Dialog.Title>
                  <EquipmentForm
                    onSuccess={() => {
                      setIsFormOpen(false)
                      mutate()
                    }}
                    onCancel={() => setIsFormOpen(false)}
                  />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}
        </div>
      </div>

      {/* ─── Barra de búsqueda y filtros ─── */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-3 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm select-none pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              id="equipment-search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(0)
              }}
              placeholder="Buscar por FR, cliente, marca, modelo, estado..."
              className="w-full bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:shadow-[0_0_8px_rgba(0,229,255,0.15)] transition-all font-sans"
            />
            {isSearching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-blue text-[10px] animate-pulse font-mono">
                Buscando...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(0)
              }}
              className="flex-1 md:w-48 bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3 py-2.5 text-xs text-text-primary focus:outline-none transition-all"
            >
              <option value="">TODOS LOS ESTADOS</option>
              <option value="En espera de diagnóstico">ESPERA DIAGNÓSTICO</option>
              <option value="En diagnóstico">EN DIAGNÓSTICO</option>
              <option value="Pendiente de aprobación">PENDIENTE APROBACIÓN</option>
              <option value="Aprobado">APROBADO</option>
              <option value="En espera de repuesto">ESPERA REPUESTO</option>
              <option value="En mantenimiento">EN MANTENIMIENTO</option>
              <option value="Listo para control de calidad">LISTO QC</option>
              <option value="Entregado">ENTREGADO</option>
              <option value="REVISION">REVISIÓN (ADMIN)</option>
              <option value="PRESTAMO">PRÉSTAMO (ADMIN)</option>
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => {
                setServiceFilter(e.target.value)
                setCurrentPage(0)
              }}
              className="flex-1 md:w-48 bg-bg-elevated border border-border-subtle focus:border-neon-blue rounded-lg px-3 py-2.5 text-xs text-text-primary focus:outline-none transition-all"
            >
              <option value="">TODOS LOS SERVICIOS</option>
              <option value="GARANTIA_CABELAB">GARANTÍA CABELAB</option>
              <option value="GARANTIA_ESAB">GARANTÍA ESAB</option>
              <option value="REVISION_GENERAL">REVISIÓN GENERAL</option>
            </select>

            {(searchQuery || statusFilter || serviceFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults(null)
                  setStatusFilter('')
                  setServiceFilter('')
                }}
                className="px-3 py-2.5 text-[10px] font-bold uppercase text-text-secondary border border-border-subtle rounded-lg hover:border-neon-blue hover:text-neon-blue transition-all select-none whitespace-nowrap"
              >
                ✕ Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Indicadores de búsqueda activa */}
        {isInSearchMode && (
          <div className="flex items-center gap-2 mt-2 px-1">
            <span className="text-[10px] text-text-secondary font-mono">
              {displayTotal === 0
                ? 'Sin resultados para '
                : `${displayTotal} resultado${displayTotal !== 1 ? 's' : ''} para `}
              <span className="text-neon-blue font-bold">"{searchQuery}"</span>
            </span>
            <span className="text-[10px] text-text-muted">— buscando en FR, cliente, marca, modelo, estado</span>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm">
        {showLoader ? (
          <div className="flex justify-center items-center py-20">
            <span className="text-neon-blue animate-pulse font-mono text-xs uppercase tracking-widest">
              {isSearching ? 'Buscando equipos...' : 'Cargando lista de equipos...'}
            </span>
          </div>
        ) : (
          <EquipmentTable
            equipments={displayEquipments}
            currentPage={isInSearchMode ? 0 : currentPage}
            totalPages={isInSearchMode ? 1 : totalPages}
            onPageChange={isInSearchMode ? undefined : setCurrentPage}
            onUpdateSuccess={() => {
              mutate()
              if (searchQuery.trim().length >= 2) {
                // Refresca el resultado de búsqueda también
                fetch(`/api/equipment/search?q=${encodeURIComponent(searchQuery.trim())}&include_delivered=${includeDelivered}`)
                  .then(r => r.json())
                  .then(d => { if (d.success) setSearchResults(d.data.results || []) })
                  .catch(() => {})
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
