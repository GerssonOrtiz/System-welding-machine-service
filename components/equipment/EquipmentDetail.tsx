// components/equipment/EquipmentDetail.tsx
'use client'

import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { toast } from 'sonner'
import {
  ChevronDown,
  ChevronUp,
  QrCode,
  Pencil,
  Save,
  X,
  Zap,
  Clock,
  BarChart2,
  History,
  FileText,
  ExternalLink,
  Dna,
  User,
  Wrench,
  Package,
} from 'lucide-react'
import { useEquipmentDetail } from '@/hooks/useEquipmentList'
import { useUser } from '@/hooks/useUser'
import StatusBadge from './StatusBadge'
import StatusChangeModal from './StatusChangeModal'
import ClientSelector from './ClientSelector'
import BrandSelector from './BrandSelector'
import QRPrintModal from './QRPrintModal'
import ModalEntregaRepuestos from './modals/ModalEntregaRepuestos'
import {
  PARTS_STATUS_LABELS,
  PARTS_STATUS_COLORS,
  type PartsStatus,
  type ApprovedPartItem,
} from '@/types/equipment'

interface EquipmentDetailProps {
  isOpen: boolean
  onClose: () => void
  equipmentId: string | null
  onStatusUpdated?: () => void
}

/** Botón de sección colapsable reutilizable */
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string | number
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-border-subtle overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-elevated/30 hover:bg-bg-elevated/60 transition-colors text-left group"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-wider group-hover:text-text-primary transition-colors">
          {icon}
          {title}
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 rounded-full bg-neon-blue/10 text-neon-blue text-[9px] font-bold border border-neon-blue/20">
              {badge}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp size={14} className="text-text-secondary shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-text-secondary shrink-0" />
        )}
      </button>
      {open && <div className="px-4 py-4 bg-bg-elevated/10">{children}</div>}
    </div>
  )
}

export default function EquipmentDetail({
  isOpen,
  onClose,
  equipmentId,
  onStatusUpdated,
}: EquipmentDetailProps) {
  const { user, profile, role } = useUser()
  const { equipment, history, nextStates, canAdvance, isLoading, mutate } = useEquipmentDetail(equipmentId)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Edit fields state
  const [editPriorityLevel, setEditPriorityLevel] = useState(0)
  const [editFr, setEditFr] = useState('')
  const [editClientName, setEditClientName] = useState('')
  const [editBrand, setEditBrand] = useState('')
  const [editModel, setEditModel] = useState('')
  const [editSerial, setEditSerial] = useState('')
  const [editReportNumber, setEditReportNumber] = useState('')
  const [editReportUrl, setEditReportUrl] = useState('')
  const [editServiceType, setEditServiceType] = useState('')
  const [editDateIn, setEditDateIn] = useState('')
  const [editClientReport, setEditClientReport] = useState('')
  const [editAccessories, setEditAccessories] = useState('')
  const [editConditionIn, setEditConditionIn] = useState('')
  const [editObservations, setEditObservations] = useState('')

  // Operational timestamps states
  const [editStartDiag, setEditStartDiag] = useState('')
  const [editEndDiag, setEditEndDiag] = useState('')
  const [editPendingAppr, setEditPendingAppr] = useState('')
  const [editAppr, setEditAppr] = useState('')
  const [editStartMaint, setEditStartMaint] = useState('')
  const [editEndMaint, setEditEndMaint] = useState('')
  const [editFinalized, setEditFinalized] = useState('')

  if (!equipmentId) return null

  const handleStatusChangeSuccess = () => {
    mutate()
    if (onStatusUpdated) onStatusUpdated()
  }

  const formatToLocalISO = (dateStr: string | null) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      const offset = d.getTimezoneOffset()
      const localDate = new Date(d.getTime() - offset * 60 * 1000)
      return localDate.toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isSuperadmin = role === 'superadmin'

  const startEditMode = () => {
    if (!equipment) return
    setEditFr(equipment.fr_number || '')
    setEditClientName(equipment.client_name || '')
    setEditBrand(equipment.brand || '')
    setEditModel(equipment.model || '')
    setEditSerial(equipment.serial_number || '')
    setEditReportNumber(equipment.report_number || '')
    setEditReportUrl((equipment as any).report_url || '')
    setEditServiceType(equipment.service_type || 'REVISION_GENERAL')
    setEditPriorityLevel(equipment.priority_level || (equipment.is_priority ? 1 : 0))
    if (equipment.date_in) {
      try {
        const d = new Date(equipment.date_in)
        const offset = d.getTimezoneOffset()
        const localDate = new Date(d.getTime() - offset * 60 * 1000)
        setEditDateIn(localDate.toISOString().slice(0, 16))
      } catch {
        setEditDateIn('')
      }
    } else {
      setEditDateIn('')
    }
    setEditClientReport(equipment.client_report || '')
    setEditAccessories(equipment.accessories || '')
    setEditConditionIn(equipment.condition_in || '')
    setEditObservations(equipment.additional_observations || '')
    setEditStartDiag(formatToLocalISO(equipment.start_diagnosis_at))
    setEditEndDiag(formatToLocalISO(equipment.end_diagnosis_at))
    setEditPendingAppr(formatToLocalISO(equipment.pending_approval_at))
    setEditAppr(formatToLocalISO(equipment.approval_at))
    setEditStartMaint(formatToLocalISO(equipment.start_maintenance_at))
    setEditEndMaint(formatToLocalISO(equipment.end_maintenance_at))
    setEditFinalized(formatToLocalISO(equipment.finalized_at))
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/equipment/${equipmentId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fr_number: editFr,
          client_name: editClientName,
          brand: editBrand,
          model: editModel,
          serial_number: editSerial,
          report_number: editReportNumber,
          report_url: editReportUrl,
          service_type: editServiceType,
          priority_level: editPriorityLevel,
          is_priority: editPriorityLevel > 0,
          date_in: editDateIn ? new Date(editDateIn).toISOString() : undefined,
          client_report: editClientReport,
          accessories: editAccessories,
          condition_in: editConditionIn,
          additional_observations: editObservations,
          start_diagnosis_at: editStartDiag ? new Date(editStartDiag).toISOString() : null,
          end_diagnosis_at: editEndDiag ? new Date(editEndDiag).toISOString() : null,
          pending_approval_at: editPendingAppr ? new Date(editPendingAppr).toISOString() : null,
          approval_at: editAppr ? new Date(editAppr).toISOString() : null,
          start_maintenance_at: editStartMaint ? new Date(editStartMaint).toISOString() : null,
          end_maintenance_at: editEndMaint ? new Date(editEndMaint).toISOString() : null,
          finalized_at: editFinalized ? new Date(editFinalized).toISOString() : null,
        }),
      })

      const resData = await res.json()
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'No se pudo actualizar el equipo')
      }

      toast.success('Información del equipo actualizada con éxito')
      setIsEditing(false)
      mutate()
      if (onStatusUpdated) onStatusUpdated()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al guardar cambios')
    } finally {
      setIsSaving(false)
    }
  }

  const priorityLevel = equipment?.priority_level || (equipment?.is_priority ? 1 : 0)
  const GENERIC_SERIALS = ['N/S', 'S/N', 'N/A', 'SIN SERIE', 'SIN N/S', '-', '.']
  const hasValidSerial =
    Boolean(equipment?.serial_number?.trim()) &&
    !GENERIC_SERIALS.includes((equipment?.serial_number || '').trim().toUpperCase())

  // Input style shared
  const inputCls =
    'bg-bg-elevated border border-border-subtle rounded px-2.5 py-1.5 text-xs focus:border-neon-blue focus:outline-none text-text-primary w-full'

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-bg-elevated/85 backdrop-blur-sm z-40 transition-opacity" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[840px] max-h-[92vh] overflow-y-auto bg-bg-surface border border-neon-blue/20 rounded-xl shadow-neon-blue z-40 font-sans text-text-primary animate-in fade-in zoom-in-95 duration-150 scrollbar-thin">

            {/* ── Cabecera fija ── */}
            <div className="sticky top-0 z-10 bg-bg-surface border-b border-border-subtle px-6 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={16} className="text-neon-blue shrink-0" />
                <Dialog.Title className="text-base font-bold text-neon-blue truncate">
                  {equipment?.fr_number || 'Cargando...'}
                </Dialog.Title>
                {priorityLevel > 0 && (
                  <span className="shrink-0 bg-neon-purple/20 border border-neon-purple/50 text-neon-purple text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(157,78,221,0.3)] animate-pulse">
                    {Array(priorityLevel).fill('⭐').join('')} VIP {priorityLevel}
                  </span>
                )}
                {equipment && <StatusBadge status={equipment.status_name} color={equipment.status_color} />}
                {/* Badge de estado de repuestos — visible cuando hay approved_parts */}
                {equipment && (equipment as any).approved_parts && (equipment as any).approved_parts.length > 0 && (() => {
                  const ps = ((equipment as any).parts_status ?? 'SIN_REPUESTOS') as PartsStatus
                  const colors = PARTS_STATUS_COLORS[ps] ?? PARTS_STATUS_COLORS['SIN_REPUESTOS']
                  const label = PARTS_STATUS_LABELS[ps] ?? 'Sin repuestos'
                  return (
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${colors.bg} ${colors.text} ${colors.border}`}>
                      <Package size={9} />
                      {label}
                    </span>
                  )
                })()}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors shrink-0"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Cuerpo ── */}
            <div className="px-6 py-5">
              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <span className="text-neon-blue animate-pulse font-mono tracking-widest uppercase text-sm">
                    Cargando detalles...
                  </span>
                </div>
              ) : !equipment ? (
                <div className="text-center py-16">
                  <p className="text-red-400 font-semibold">No se pudo cargar la información del equipo.</p>
                </div>
              ) : (
                <div className="space-y-4">

                  {/* ── Barra de Acciones ── */}
                  <div className="flex flex-wrap gap-2 items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setIsQrModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neon-blue/60 text-neon-blue hover:bg-neon-blue/10 text-xs font-bold uppercase transition-all"
                    >
                      <QrCode size={13} />
                      Etiqueta QR
                    </button>

                    {isSuperadmin && (
                      <>
                        <button
                          onClick={isEditing ? handleSaveEdit : startEditMode}
                          disabled={isSaving}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold uppercase transition-all ${
                            isEditing
                              ? 'bg-emerald-600 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                              : 'bg-neon-purple/70 border border-neon-purple hover:bg-neon-purple/90'
                          }`}
                        >
                          {isEditing ? (
                            <><Save size={13} />{isSaving ? 'Guardando...' : 'Guardar Cambios'}</>
                          ) : (
                            <><Pencil size={13} />Editar Ficha</>
                          )}
                        </button>
                        {isEditing && (
                          <button
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle text-text-primary text-xs font-bold uppercase transition-all hover:bg-bg-elevated"
                          >
                            <X size={13} />
                            Cancelar
                          </button>
                        )}
                      </>
                    )}

                  {/* Botón dedicado para Logística: Registrar Entrega de Repuestos */}
                    {['almacen', 'admin', 'superadmin'].includes(role || '') &&
                      (equipment as any).approved_parts &&
                      (equipment as any).approved_parts.length > 0 &&
                      !isEditing && (
                        <button
                          onClick={() => setIsPartsModalOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10 text-xs font-bold uppercase transition-all"
                        >
                          <Package size={13} />
                          Registrar Entrega de Repuestos
                        </button>
                      )}

                    {(canAdvance || isSuperadmin) && !isEditing && (
                      <button
                        onClick={() => setIsStatusModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-electric text-white text-xs font-bold uppercase hover:shadow-neon-blue hover:brightness-110 transition-all"
                      >
                        <Zap size={13} />
                        {isSuperadmin ? 'Cambiar / Forzar Estado' : 'Avanzar Estado'}
                      </button>
                    )}
                  </div>

                  {/* ── Sección: Datos del Equipo ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Columna izq: Identificación */}
                    <div className="rounded-lg border border-border-subtle bg-bg-elevated/10 p-4 space-y-3">
                      <h3 className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle/50 pb-2">
                        <FileText size={12} /> Identificación
                      </h3>
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 text-xs items-center">

                        <span className="text-text-secondary font-semibold uppercase whitespace-nowrap">Ficha (FR):</span>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input type="text" value={editFr} onChange={(e) => setEditFr(e.target.value)} className={inputCls} />
                            <select
                              value={editPriorityLevel}
                              onChange={(e) => setEditPriorityLevel(parseInt(e.target.value))}
                              className="bg-bg-elevated border border-neon-purple/20 text-neon-purple text-[10px] font-bold px-2 py-1.5 rounded focus:outline-none shrink-0"
                            >
                              <option value={0}>Regular</option>
                              <option value={1}>⭐ VIP 1</option>
                              <option value={2}>⭐⭐ VIP 2</option>
                              <option value={3}>⭐⭐⭐ VIP 3</option>
                            </select>
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-neon-blue uppercase">{equipment.fr_number}</span>
                        )}

                        <span className="text-text-secondary font-semibold uppercase whitespace-nowrap">Cliente:</span>
                        {isEditing ? (
                          <ClientSelector value={editClientName} onChange={(val) => setEditClientName(val)} />
                        ) : (
                          <span className="font-medium">{equipment.client_name}</span>
                        )}

                        <span className="text-text-secondary font-semibold uppercase whitespace-nowrap">Servicio:</span>
                        {isEditing ? (
                          <select value={editServiceType} onChange={(e) => setEditServiceType(e.target.value)} className={inputCls}>
                            <option value="GARANTIA_CABELAB">GARANTÍA CABELAB</option>
                            <option value="GARANTIA_ESAB">GARANTÍA ESAB</option>
                            <option value="REVISION_GENERAL">REVISIÓN GENERAL</option>
                          </select>
                        ) : (
                          <span className="font-mono text-[11px] text-neon-purple font-semibold">{equipment.service_type}</span>
                        )}

                        <span className="text-text-secondary font-semibold uppercase whitespace-nowrap">Ingreso:</span>
                        {isEditing ? (
                          <input type="datetime-local" value={editDateIn} onChange={(e) => setEditDateIn(e.target.value)} className={inputCls} />
                        ) : (
                          <span className="font-mono text-[11px]">{formatDate(equipment.date_in)}</span>
                        )}
                      </div>
                    </div>

                    {/* Columna der: Equipo */}
                    <div className="rounded-lg border border-border-subtle bg-bg-elevated/10 p-4 space-y-3">
                      <h3 className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle/50 pb-2">
                        <Wrench size={12} /> Equipo
                      </h3>
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2.5 text-xs items-center">

                        <span className="text-text-secondary font-semibold uppercase whitespace-nowrap">Marca:</span>
                        {isEditing ? (
                          <BrandSelector value={editBrand} onChange={(val) => setEditBrand(val)} />
                        ) : (
                          <span className="font-medium">{equipment.brand}</span>
                        )}

                        <span className="text-text-secondary font-semibold uppercase whitespace-nowrap">Modelo:</span>
                        {isEditing ? (
                          <input type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)} className={inputCls} />
                        ) : (
                          <span className="font-medium">{equipment.model}</span>
                        )}

                        <span className="text-text-secondary font-semibold uppercase whitespace-nowrap">N° Serie:</span>
                        {isEditing ? (
                          <input type="text" value={editSerial} onChange={(e) => setEditSerial(e.target.value)} className={`${inputCls} font-mono`} />
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono">{equipment.serial_number || '-'}</span>
                            {hasValidSerial && (
                              <a
                                href={`/dna?s=${encodeURIComponent(equipment.serial_number!)}`}
                                className="flex items-center gap-1 text-[9px] bg-neon-purple/10 border border-neon-purple/30 text-neon-purple px-1.5 py-0.5 rounded hover:bg-neon-purple/20 transition-colors font-bold uppercase"
                                title="Ver Historial Clínico (DNA)"
                              >
                                <Dna size={9} /> DNA
                              </a>
                            )}
                          </div>
                        )}

                        {/* N° Informe y enlace PDF */}
                        {isEditing ? (
                          <>
                            <span className="text-text-secondary font-semibold uppercase whitespace-nowrap">N° Informe:</span>
                            <input type="text" value={editReportNumber} onChange={(e) => setEditReportNumber(e.target.value)} placeholder="Ej: INF-001" className={`${inputCls} font-mono`} />
                            <span className="text-text-secondary font-semibold uppercase whitespace-nowrap">Enlace PDF:</span>
                            <input type="url" value={editReportUrl} onChange={(e) => setEditReportUrl(e.target.value)} placeholder="https://drive.google.com/..." className={`${inputCls} font-mono`} />
                          </>
                        ) : (
                          <>
                            {equipment.report_number && !equipment.report_number.startsWith('INT-') && (
                              <>
                                <span className="text-text-secondary font-semibold uppercase whitespace-nowrap">N° Informe:</span>
                                <span className="font-mono text-neon-blue font-semibold">{equipment.report_number}</span>
                              </>
                            )}
                            {(equipment as any).report_url && (
                              <>
                                <span className="text-text-secondary font-semibold uppercase whitespace-nowrap">Informe PDF:</span>
                                <a
                                  href={(equipment as any).report_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 font-bold text-[11px] transition-colors"
                                >
                                  <FileText size={11} /> Ver Informe <ExternalLink size={10} />
                                </a>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Personal Asignado ── */}
                  <div className="rounded-lg border border-border-subtle bg-bg-elevated/10 px-4 py-3 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider shrink-0">
                      <User size={12} /> Técnicos:
                    </span>
                    {equipment.assigned_technicians && equipment.assigned_technicians.length > 0 ? (
                      equipment.assigned_technicians.map((tech: string, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-neon-blue/10 border border-neon-blue/20 text-neon-blue uppercase">
                          {tech}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-muted italic">Sin personal asignado</span>
                    )}
                  </div>

                  {/* ── Observaciones y Reportes — siempre visibles si tienen contenido ── */}
                  {(equipment.client_report || equipment.accessories || equipment.condition_in || equipment.additional_observations || isEditing) && (
                    <CollapsibleSection
                      title="Observaciones y Reportes"
                      icon={<FileText size={12} />}
                      defaultOpen={isEditing || !!(equipment.client_report || equipment.additional_observations)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Falla Reportada por Cliente</span>
                          {isEditing ? (
                            <textarea value={editClientReport} onChange={(e) => setEditClientReport(e.target.value)} rows={3} className="w-full bg-bg-elevated border border-border-subtle rounded-lg p-2.5 text-xs focus:border-neon-blue focus:outline-none text-text-primary resize-none" />
                          ) : (
                            <p className="text-xs text-text-primary/80 whitespace-pre-wrap leading-relaxed">{equipment.client_report || <span className="text-text-muted italic">Ninguno</span>}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Accesorios Incluidos</span>
                          {isEditing ? (
                            <textarea value={editAccessories} onChange={(e) => setEditAccessories(e.target.value)} rows={3} className="w-full bg-bg-elevated border border-border-subtle rounded-lg p-2.5 text-xs focus:border-neon-blue focus:outline-none text-text-primary resize-none" />
                          ) : (
                            <p className="text-xs text-text-primary/80 whitespace-pre-wrap leading-relaxed">{equipment.accessories || <span className="text-text-muted italic">Ninguno</span>}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Condición Física de Ingreso</span>
                          {isEditing ? (
                            <textarea value={editConditionIn} onChange={(e) => setEditConditionIn(e.target.value)} rows={3} className="w-full bg-bg-elevated border border-border-subtle rounded-lg p-2.5 text-xs focus:border-neon-blue focus:outline-none text-text-primary resize-none" />
                          ) : (
                            <p className="text-xs text-text-primary/80 whitespace-pre-wrap leading-relaxed">{equipment.condition_in || <span className="text-text-muted italic">Ninguna</span>}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Observaciones Técnicas</span>
                          {isEditing ? (
                            <textarea value={editObservations} onChange={(e) => setEditObservations(e.target.value)} rows={3} className="w-full bg-bg-elevated border border-border-subtle rounded-lg p-2.5 text-xs focus:border-neon-blue focus:outline-none text-text-primary resize-none" />
                          ) : (
                            <p className="text-xs text-neon-blue/90 whitespace-pre-wrap leading-relaxed">{equipment.additional_observations || <span className="text-text-muted italic not-italic text-text-muted">Ninguna</span>}</p>
                          )}
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* ── Tiempos Operativos — colapsable, cerrado por defecto ── */}
                  <CollapsibleSection title="Tiempos Operativos" icon={<Clock size={12} />} defaultOpen={isEditing}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Diagnóstico */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Inicio de Diagnóstico</span>
                        {isEditing ? (
                          <input type="datetime-local" value={editStartDiag} onChange={(e) => setEditStartDiag(e.target.value)} className={inputCls} />
                        ) : (
                          <p className="text-text-primary/80">{formatDate(equipment.start_diagnosis_at)}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Fin de Diagnóstico</span>
                        {isEditing ? (
                          <input type="datetime-local" value={editEndDiag} onChange={(e) => setEditEndDiag(e.target.value)} className={inputCls} />
                        ) : (
                          <p className="text-text-primary/80">{formatDate(equipment.end_diagnosis_at)}</p>
                        )}
                      </div>
                      {/* Pendiente aprob. / Aprobación */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Pendiente de Aprobación</span>
                        {isEditing ? (
                          <input type="datetime-local" value={editPendingAppr} onChange={(e) => setEditPendingAppr(e.target.value)} className={inputCls} />
                        ) : (
                          <p className="text-text-primary/80">{formatDate(equipment.pending_approval_at)}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Aprobación</span>
                        {isEditing ? (
                          <input type="datetime-local" value={editAppr} onChange={(e) => setEditAppr(e.target.value)} className={inputCls} />
                        ) : (
                          <p className="text-text-primary/80">{formatDate(equipment.approval_at)}</p>
                        )}
                      </div>
                      {/* Mantenimiento */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Inicio de Mantenimiento</span>
                        {isEditing ? (
                          <input type="datetime-local" value={editStartMaint} onChange={(e) => setEditStartMaint(e.target.value)} className={inputCls} />
                        ) : (
                          <p className="text-text-primary/80">{formatDate(equipment.start_maintenance_at)}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Fin de Mantenimiento</span>
                        {isEditing ? (
                          <input type="datetime-local" value={editEndMaint} onChange={(e) => setEditEndMaint(e.target.value)} className={inputCls} />
                        ) : (
                          <p className="text-text-primary/80">{formatDate(equipment.end_maintenance_at)}</p>
                        )}
                      </div>
                      {/* Finalizado */}
                      <div className="space-y-1 sm:col-span-2">
                        <span className="text-[10px] font-bold text-text-secondary uppercase">Finalizado / Entregado</span>
                        {isEditing ? (
                          <input type="datetime-local" value={editFinalized} onChange={(e) => setEditFinalized(e.target.value)} className={inputCls} />
                        ) : (
                          <p className="text-text-primary/80">{formatDate(equipment.finalized_at)}</p>
                        )}
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* ── Seguimiento por Fases — colapsable, cerrado por defecto ── */}
                  <CollapsibleSection title="Demora por Fases" icon={<BarChart2 size={12} />}>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-bg-elevated/60 p-3 rounded-lg border border-border-subtle flex flex-col items-center text-center">
                        <span className="text-[9px] text-text-secondary font-bold uppercase mb-1.5 leading-tight">Fase 1<br/>Ingreso → Pendiente</span>
                        <span className="text-lg font-mono font-bold text-neon-blue">
                          {equipment.phase_1_days}
                          <small className="text-[9px] ml-0.5">d</small>
                        </span>
                      </div>
                      <div className="bg-bg-elevated/60 p-3 rounded-lg border border-border-subtle flex flex-col items-center text-center">
                        <span className="text-[9px] text-text-secondary font-bold uppercase mb-1.5 leading-tight">Fase 2<br/>Eval. → Aprobación</span>
                        <span className="text-lg font-mono font-bold text-neon-purple">
                          {equipment.phase_2_days}
                          <small className="text-[9px] ml-0.5">d</small>
                        </span>
                      </div>
                      <div className="bg-bg-elevated/60 p-3 rounded-lg border border-border-subtle flex flex-col items-center text-center">
                        <span className="text-[9px] text-text-secondary font-bold uppercase mb-1.5 leading-tight">Fase 3<br/>Aprob. → Entrega</span>
                        <span className="text-lg font-mono font-bold text-emerald-400">
                          {equipment.phase_3_days}
                          <small className="text-[9px] ml-0.5">d</small>
                        </span>
                      </div>
                    </div>
                    {/* Total días */}
                    <div className="mt-3 flex items-center justify-end gap-2 text-xs">
                      <span className="text-text-secondary uppercase font-semibold">Total transcurrido:</span>
                      <span className="font-mono font-bold text-neon-blue text-sm">{equipment.days_elapsed} <small className="text-[10px]">días</small></span>
                    </div>
                  </CollapsibleSection>

                  {/* ── Control de Repuestos — colapsable, abierto por defecto si hay datos ── */}
                  {(equipment as any).approved_parts && (equipment as any).approved_parts.length > 0 && (() => {
                    const approvedParts = (equipment as any).approved_parts as ApprovedPartItem[]
                    const ps = ((equipment as any).parts_status ?? 'SIN_REPUESTOS') as PartsStatus
                    const colors = PARTS_STATUS_COLORS[ps] ?? PARTS_STATUS_COLORS['SIN_REPUESTOS']
                    return (
                      <CollapsibleSection
                        title="Control de Repuestos"
                        icon={<Package size={12} />}
                        defaultOpen={true}
                        badge={PARTS_STATUS_LABELS[ps]}
                      >
                        <div className="space-y-3">
                          <div className="rounded-lg border border-border-subtle overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-bg-elevated/40 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                  <th className="px-3 py-2 text-left">Repuesto / Insumo</th>
                                  <th className="px-3 py-2 text-center">Precio</th>
                                  <th className="px-3 py-2 text-center">Solicitado</th>
                                  <th className="px-3 py-2 text-center">Entregado</th>
                                  <th className="px-3 py-2 text-center">Saldo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-subtle/50">
                                {approvedParts.map((part, idx) => {
                                  const saldo = part.cantidad_solicitada - part.cantidad_entregada
                                  return (
                                    <tr key={part.id || idx} className="hover:bg-bg-elevated/20">
                                      <td className="px-3 py-2 text-text-primary">{part.descripcion}</td>
                                      <td className="px-3 py-2 text-center text-text-secondary font-mono text-[11px]">
                                        S/ {part.precio}
                                      </td>
                                      <td className="px-3 py-2 text-center text-text-secondary font-mono font-bold">
                                        {part.cantidad_solicitada}
                                      </td>
                                      <td className="px-3 py-2 text-center font-mono font-bold text-emerald-400">
                                        {part.cantidad_entregada}
                                      </td>
                                      <td className="px-3 py-2 text-center font-mono font-bold">
                                        {saldo > 0 ? (
                                          <span className="text-yellow-400">{saldo} Pendiente{saldo > 1 ? 's' : ''}</span>
                                        ) : (
                                          <span className="text-emerald-400">✓ Completo</span>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                          {/* Historial de entregas */}
                          {(equipment as any).parts_deliveries && (equipment as any).parts_deliveries.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                Historial de Entregas
                              </p>
                              {((equipment as any).parts_deliveries as any[]).map((d: any, idx: number) => (
                                <div key={d.id || idx} className="p-2 rounded-lg bg-bg-elevated/30 border border-border-subtle/50 text-[10px] space-y-0.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-text-primary">
                                      {d.items?.map((i: any) => `${i.cantidad}× ${i.descripcion}`).join(', ')}
                                    </span>
                                    <span className="text-text-muted shrink-0">{formatDate(d.fecha)}</span>
                                  </div>
                                  <span className="text-text-secondary">Por: <strong>{d.entregado_por}</strong></span>
                                  {d.observaciones && (
                                    <p className="text-text-muted italic">{d.observaciones}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CollapsibleSection>
                    )
                  })()}

                  {/* ── Historial de Estados — colapsable, cerrado por defecto ── */}
                  <CollapsibleSection
                    title="Historial de Estados"
                    icon={<History size={12} />}
                    badge={history.length}
                  >
                    <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                      {history.length === 0 ? (
                        <p className="text-xs text-text-secondary text-center py-4">No hay registros en el historial.</p>
                      ) : (
                        history.map((h: any, idx: number) => (
                          <div key={h.id || idx} className="p-3 text-xs bg-bg-elevated/30 rounded-lg border border-border-subtle/50 space-y-1.5">
                            <div className="flex justify-between items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-text-secondary font-mono">{h.previous_status || 'REGISTRO'}</span>
                                <span className="text-neon-blue font-bold">➔</span>
                                <span className="text-neon-blue font-bold uppercase">{h.new_status}</span>
                                {h.is_override && (
                                  <span className="text-neon-purple font-bold text-[10px]">⚠️ OVERRIDE</span>
                                )}
                              </div>
                              <span className="text-[10px] text-text-muted shrink-0">{formatDate(h.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-[10px] text-text-secondary">
                              <span>Por: <strong className="text-text-primary">{h.changed_by_username}</strong></span>
                              {h.changed_by_role && (
                                <span className="px-1.5 py-0.5 rounded bg-bg-surface border border-border-subtle text-[9px] font-bold text-neon-blue uppercase">
                                  {h.changed_by_role}
                                </span>
                              )}
                            </div>
                            {(h.notes || h.override_reason) && (
                              <div className={`p-2 rounded text-[10px] leading-relaxed ${h.is_override ? 'bg-neon-purple/5 border border-neon-purple/20 text-neon-purple italic' : 'bg-bg-surface/60 border border-border-subtle/80 text-text-secondary'}`}>
                                {h.is_override ? 'Motivo: ' : 'Nota: '}
                                {h.override_reason || h.notes}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleSection>

                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal de cambio de estado */}
      {equipment && (
        <StatusChangeModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          equipmentId={equipment.id}
          currentStatusId={equipment.current_status_id}
          currentStatusName={equipment.status_name}
          currentStatusColor={equipment.status_color}
          nextStates={nextStates}
          onSuccess={handleStatusChangeSuccess}
        />
      )}

      {/* Modal de entrega de repuestos (Logística) */}
      {equipment && (equipment as any).approved_parts && (equipment as any).approved_parts.length > 0 && (
        <ModalEntregaRepuestos
          isOpen={isPartsModalOpen}
          onClose={() => setIsPartsModalOpen(false)}
          equipmentId={equipment.id}
          frNumber={equipment.fr_number || ''}
          approvedParts={(equipment as any).approved_parts as ApprovedPartItem[]}
          onSuccess={() => {
            mutate()
            if (onStatusUpdated) onStatusUpdated()
          }}
        />
      )}

      {/* Modal de etiqueta QR */}
      {equipment && (
        <QRPrintModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          serialNumber={equipment.serial_number || ''}
          frNumber={equipment.fr_number || ''}
          brand={equipment.brand || ''}
          model={equipment.model || ''}
          clientName={equipment.client_name || ''}
        />
      )}
    </>
  )
}
