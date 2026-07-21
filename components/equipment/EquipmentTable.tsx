// components/equipment/EquipmentTable.tsx
'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'
import StatusBadge from './StatusBadge'
import EquipmentDetail from './EquipmentDetail'

interface EquipmentTableProps {
  equipments: any[]
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onUpdateSuccess?: () => void
  showTechs?: boolean
}

export default function EquipmentTable({
  equipments,
  currentPage = 0,
  totalPages = 0,
  onPageChange,
  onUpdateSuccess,
  showTechs = true,
}: EquipmentTableProps) {
  const { role } = useUser()
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleOpenDetail = (id: string) => {
    setSelectedEqId(id)
    setIsDetailOpen(true)
  }

  const handleDelete = async (id: string, frNumber: string) => {
    const confirm = window.confirm(`¿Está seguro de que desea eliminar permanentemente el equipo ${frNumber}? Esta acción es irreversible.`)
    if (!confirm) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/equipment/${id}/delete`, {
        method: 'DELETE',
      })
      const resData = await res.json()
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'No se pudo eliminar el equipo')
      }
      toast.success(`Equipo ${frNumber} eliminado con éxito`)
      if (onUpdateSuccess) onUpdateSuccess()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al eliminar el equipo')
    } finally {
      setDeletingId(null)
    }
  }

  const isEditable = ['superadmin', 'admin'].includes(role || '')

  return (
    <div className="space-y-4 font-sans text-text-primary">
      <div className="overflow-x-auto border border-border-subtle rounded-xl bg-bg-surface">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-base/40 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              <th className="px-5 py-3">Ficha (FR)</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Marca/Modelo</th>
              <th className="px-5 py-3">Estado</th>
              {showTechs && <th className="px-5 py-3">Técnico</th>}
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/50 text-xs">
            {equipments.length === 0 ? (
              <tr>
                <td colSpan={showTechs ? 6 : 5} className="px-5 py-8 text-center text-text-secondary">
                  No se encontraron equipos registrados en el sistema.
                </td>
              </tr>
            ) : (
              equipments.map((eq) => {
                const isDelayed = eq.days_elapsed > 5 && !eq.is_terminal
                const priorityLevel = eq.priority_level || (eq.is_priority ? 1 : 0)
                const isPriority = priorityLevel > 0

                const priorityStars = () => {
                  if (priorityLevel === 1) return '⭐'
                  if (priorityLevel === 2) return '⭐⭐'
                  if (priorityLevel === 3) return '⭐⭐⭐'
                  return null
                }

                return (
                  <tr
                    key={eq.id}
                    className={`hover:bg-bg-base/20 transition-colors ${
                      priorityLevel === 3
                        ? 'bg-neon-purple/10 border-l-4 border-l-neon-purple shadow-[inset_4px_0_15px_rgba(157,78,221,0.1)]'
                        : priorityLevel === 2
                        ? 'bg-neon-purple/5 border-l-2 border-l-neon-purple/70'
                        : priorityLevel === 1
                        ? 'bg-neon-purple/[0.02] border-l-2 border-l-neon-purple/40'
                        : isDelayed
                          ? 'border-l-2 border-l-red-500 shadow-[inset_4px_0_12px_rgba(239,68,68,0.03)]'
                          : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <td className={`px-5 py-4 font-mono font-bold uppercase ${isPriority ? 'text-neon-purple' : 'text-neon-blue'}`}>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          {eq.fr_number}
                        </div>
                        {isPriority && (
                          <span className="text-[9px] font-black uppercase tracking-tighter">
                            {priorityStars()} VIP {priorityLevel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium max-w-[150px] truncate">
                      {eq.client_name}
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {eq.brand} - {eq.model}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={eq.status_name} color={eq.status_color} />
                    </td>
                    {showTechs && (
                      <td className="px-5 py-4 text-text-secondary max-w-[120px] truncate">
                        {eq.maintenance_tech_username || eq.diagnosis_tech_username || '-'}
                      </td>
                    )}
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetail(eq.id)}
                        className="px-3 py-1 rounded border border-neon-blue text-neon-blue hover:bg-neon-blue/10 transition-all font-semibold uppercase text-[10px]"
                      >
                        Detalle
                      </button>
                      {isEditable && (
                        <button
                          onClick={() => handleDelete(eq.id, eq.fr_number)}
                          disabled={deletingId === eq.id}
                          className="px-3 py-1 rounded border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all font-semibold uppercase text-[10px] disabled:opacity-40"
                        >
                          {deletingId === eq.id ? 'Borrando...' : 'Eliminar'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex justify-between items-center bg-bg-surface/50 border border-border-subtle p-3 rounded-xl text-xs text-text-secondary">
          <span>
            Página <strong className="text-text-primary">{currentPage + 1}</strong> de{' '}
            <strong className="text-text-primary">{totalPages}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-3 py-1.5 border border-border-subtle rounded-lg hover:border-neon-blue hover:text-neon-blue disabled:opacity-40 disabled:hover:border-border-subtle disabled:hover:text-text-secondary transition-all font-semibold uppercase"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="px-3 py-1.5 border border-border-subtle rounded-lg hover:border-neon-blue hover:text-neon-blue disabled:opacity-40 disabled:hover:border-border-subtle disabled:hover:text-text-secondary transition-all font-semibold uppercase"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Detalle modal */}
      {selectedEqId && (
        <EquipmentDetail
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setSelectedEqId(null)
          }}
          equipmentId={selectedEqId}
          onStatusUpdated={onUpdateSuccess}
        />
      )}
    </div>
  )
}
