// components/equipment/EquipmentTable.tsx
'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'
import StatusBadge from './StatusBadge'
import EquipmentDetail from './EquipmentDetail'
import QRPrintModal from './QRPrintModal'
import ModalEntregaRepuestos from './modals/ModalEntregaRepuestos'
import { EmptyState } from '@/components/ui/EmptyState'
import { Package, QrCode, Eye, Trash2 } from 'lucide-react'
import type { ApprovedPartItem } from '@/types/equipment'

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
  const [qrModalEq, setQrModalEq] = useState<any | null>(null)
  const [partsModalEq, setPartsModalEq] = useState<any | null>(null)

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
    <div className="space-y-4 font-sans text-text-forge">
      <div className="overflow-x-auto border border-amber-border/25 rounded-xl glass-card shadow-glass">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-amber-border/30 glass-sidebar text-[11px] font-bold text-text-forge-mid uppercase tracking-wider sticky top-0 z-10">
              <th className="px-5 py-3">Ficha (FR)</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Marca/Modelo</th>
              <th className="px-5 py-3">Estado</th>
              {showTechs && <th className="px-5 py-3">Técnico</th>}
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-border/15 text-xs">
            {equipments.length === 0 ? (
              <tr>
                <td colSpan={showTechs ? 6 : 5} className="px-5 py-6">
                  <EmptyState
                    icon={Package}
                    title="No se encontraron equipos"
                    description="No hay registros disponibles que coincidan con los filtros seleccionados."
                    compact
                  />
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
                    className={`hover:bg-amber-ghost/30 transition-standard cursor-pointer ${
                      priorityLevel === 3
                        ? 'bg-amber-ghost/40 border-l-4 border-l-amber-core shadow-[inset_4px_0_15px_rgba(245,158,11,0.15)]'
                        : priorityLevel === 2
                        ? 'bg-amber-ghost/20 border-l-2 border-l-amber-glow'
                        : priorityLevel === 1
                        ? 'bg-amber-ghost/10 border-l-2 border-l-amber-border'
                        : isDelayed
                          ? 'border-l-2 border-l-red-500 shadow-[inset_4px_0_12px_rgba(239,68,68,0.05)]'
                          : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <td className={`px-5 py-4 font-mono font-bold uppercase ${isPriority ? 'text-amber-glow' : 'text-amber-core'}`}>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          {eq.fr_number}
                        </div>
                        {isPriority && (
                          <span className="text-[9px] font-black uppercase tracking-tighter text-amber-glow">
                            {priorityStars()} VIP {priorityLevel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium max-w-[150px] truncate text-text-forge">
                      {eq.client_name}
                    </td>
                    <td className="px-5 py-4 text-text-forge-mid">
                      {eq.brand} - {eq.model}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={eq.status_name} color={eq.status_color} />
                        {eq.approved_parts && eq.approved_parts.length > 0 && (() => {
                          const ps = eq.parts_status ?? 'SIN_REPUESTOS'
                          const partsCfg: Record<string, { cls: string; label: string }> = {
                            SIN_REPUESTOS: { cls: 'text-red-400 border-red-500/20 bg-red-500/5',       label: '📦 Sin repuestos' },
                            PARCIAL:       { cls: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', label: '📦 Parcial' },
                            COMPLETO:      { cls: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10', label: '📦 Listo' },
                          }
                          const cfg = partsCfg[ps] ?? partsCfg['SIN_REPUESTOS']
                          return (
                            <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded border ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                          )
                        })()}
                      </div>
                    </td>
                    {showTechs && (
                      <td className="px-5 py-4 text-text-secondary max-w-[120px] truncate">
                        {eq.maintenance_tech_username || eq.diagnosis_tech_username || '-'}
                      </td>
                    )}
                    <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {['almacen', 'admin', 'superadmin'].includes(role || '') &&
                        eq.approved_parts &&
                        eq.approved_parts.length > 0 && (
                          <button
                            onClick={() => setPartsModalEq(eq)}
                            title="Registrar entrega de repuestos (Almacén / Logística)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-border/50 text-amber-glow hover:bg-amber-ghost bg-amber-ghost/30 transition-all font-semibold uppercase text-[10px]"
                          >
                            <Package size={12} />
                            <span>Repuestos</span>
                          </button>
                        )}
                      <button
                        onClick={() => setQrModalEq(eq)}
                        title="Generar e imprimir etiqueta con código QR"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-border/30 hover:border-amber-glow text-text-forge-mid hover:text-amber-glow glass-card hover:bg-amber-ghost/40 transition-all font-semibold uppercase text-[10px]"
                      >
                        <QrCode size={12} />
                        <span>QR</span>
                      </button>
                      <button
                        onClick={() => handleOpenDetail(eq.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-border text-amber-glow bg-amber-ghost/50 hover:bg-amber-ghost hover:border-amber-glow transition-all font-bold uppercase text-[10px] shadow-amber-sm"
                      >
                        <Eye size={12} />
                        <span>Detalle</span>
                      </button>
                      {isEditable && (
                        <button
                          onClick={() => handleDelete(eq.id, eq.fr_number)}
                          disabled={deletingId === eq.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 transition-all font-semibold uppercase text-[10px] disabled:opacity-40"
                        >
                          <Trash2 size={12} />
                          <span>{deletingId === eq.id ? 'Borrando...' : 'Eliminar'}</span>
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
        <div className="flex justify-between items-center glass-card border border-amber-border/25 p-3 rounded-xl text-xs text-text-forge-mid shadow-glass">
          <span>
            Página <strong className="text-text-forge">{currentPage + 1}</strong> de{' '}
            <strong className="text-text-forge">{totalPages}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-3 py-1.5 border border-amber-border/30 rounded-lg hover:border-amber-glow hover:text-amber-glow disabled:opacity-40 disabled:hover:border-amber-border/30 disabled:hover:text-text-forge-mid transition-all font-semibold uppercase glass-input"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="px-3 py-1.5 border border-amber-border/30 rounded-lg hover:border-amber-glow hover:text-amber-glow disabled:opacity-40 disabled:hover:border-amber-border/30 disabled:hover:text-text-forge-mid transition-all font-semibold uppercase glass-input"
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

      {/* Modal de entrega de repuestos directo desde la tabla */}
      {partsModalEq && (
        <ModalEntregaRepuestos
          isOpen={Boolean(partsModalEq)}
          onClose={() => setPartsModalEq(null)}
          equipmentId={partsModalEq.id}
          frNumber={partsModalEq.fr_number || ''}
          approvedParts={(partsModalEq.approved_parts || []) as ApprovedPartItem[]}
          onSuccess={() => {
            if (onUpdateSuccess) onUpdateSuccess()
          }}
        />
      )}

      {/* Modal de impresión de etiqueta QR */}
      {qrModalEq && (
        <QRPrintModal
          isOpen={Boolean(qrModalEq)}
          onClose={() => setQrModalEq(null)}
          serialNumber={qrModalEq.serial_number || ''}
          frNumber={qrModalEq.fr_number || ''}
          brand={qrModalEq.brand || ''}
          model={qrModalEq.model || ''}
          clientName={qrModalEq.client_name || ''}
        />
      )}
    </div>
  )
}
