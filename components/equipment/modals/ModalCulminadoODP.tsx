// components/equipment/modals/ModalCulminadoODP.tsx
'use client'

import React, { useRef } from 'react'
import { CheckCircle, UploadCloud, Link as LinkIcon, X, FileText, ShieldCheck } from 'lucide-react'

interface ModalCulminadoODPProps {
  observaciones: string
  onObservacionesChange: (v: string) => void
  serviceReportFile: File | null
  onServiceReportFileChange: (f: File | null) => void
  serviceReportUrl: string
  onServiceReportUrlChange: (v: string) => void
  vrdFile: File | null
  onVrdFileChange: (f: File | null) => void
  vrdCertificateUrl: string
  onVrdCertificateUrlChange: (v: string) => void
}

const TEXTO_PREDEFINIDO =
  'Nos complace informarles que el servicio ha sido completado satisfactoriamente. El equipo ha pasado el control de calidad y se encuentra en óptimas condiciones, listo para ser retirado por el cliente.'

export default function ModalCulminadoODP({
  observaciones,
  onObservacionesChange,
  serviceReportFile,
  onServiceReportFileChange,
  serviceReportUrl,
  onServiceReportUrlChange,
  vrdFile,
  onVrdFileChange,
  vrdCertificateUrl,
  onVrdCertificateUrlChange,
}: ModalCulminadoODPProps) {
  const reportInputRef = useRef<HTMLInputElement>(null)
  const vrdInputRef = useRef<HTMLInputElement>(null)

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file && file.type !== 'application/pdf') {
      onServiceReportFileChange(null)
      return
    }
    onServiceReportFileChange(file)
  }

  const handleVrdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file && file.type !== 'application/pdf') {
      onVrdFileChange(null)
      return
    }
    onVrdFileChange(file)
  }

  return (
    <div className="space-y-4 pt-3 border-t border-neon-blue/20">
      <p className="text-[10px] font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
        <CheckCircle size={12} /> Servicio Culminado — Listo para Entrega
      </p>

      {/* Texto predefinido (solo lectura) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Mensaje del correo (predefinido)
        </label>
        <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-muted italic leading-relaxed">
          {TEXTO_PREDEFINIDO}
        </div>
      </div>

      {/* ── DOCUMENTO 1: INFORME DE SERVICIO (OPCIONAL) ── */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={13} /> Informe de Servicio <span className="text-[10px] text-text-muted font-normal lowercase">(opcional)</span>
          </label>
        </div>

        {/* Subida archivo PDF */}
        <div className="space-y-1">
          <div
            onClick={() => reportInputRef.current?.click()}
            className={`flex items-center gap-3 p-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
              serviceReportFile
                ? 'border-neon-blue/50 bg-neon-blue/5'
                : 'border-border-subtle hover:border-neon-blue/30 bg-bg-elevated'
            }`}
          >
            <UploadCloud size={16} className={serviceReportFile ? 'text-neon-blue' : 'text-text-muted'} />
            <div className="flex-1 min-w-0">
              {serviceReportFile ? (
                <p className="text-xs text-neon-blue font-semibold truncate">{serviceReportFile.name}</p>
              ) : (
                <p className="text-xs text-text-muted">Subir archivo PDF de informe de servicio</p>
              )}
            </div>
            {serviceReportFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onServiceReportFileChange(null)
                  if (reportInputRef.current) reportInputRef.current.value = ''
                }}
                className="text-text-muted hover:text-red-400 transition-colors p-1"
                title="Quitar archivo"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <input
            ref={reportInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleReportFileChange}
            className="hidden"
          />
        </div>

        {/* Link / URL del informe */}
        <div className="space-y-1">
          <div className="relative">
            <input
              type="url"
              value={serviceReportUrl}
              onChange={(e) => onServiceReportUrlChange(e.target.value)}
              placeholder="Enlace al informe (Drive, OneDrive o web)..."
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:outline-none transition-all"
            />
            <LinkIcon size={12} className="absolute left-2.5 top-2.5 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── DOCUMENTO 2: CERTIFICADO DE VRD (OPCIONAL) ── */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface/40 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neon-purple uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={13} /> Certificado de VRD <span className="text-[10px] text-text-muted font-normal lowercase">(opcional)</span>
          </label>
        </div>

        {/* Subida archivo PDF */}
        <div className="space-y-1">
          <div
            onClick={() => vrdInputRef.current?.click()}
            className={`flex items-center gap-3 p-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
              vrdFile
                ? 'border-neon-purple/50 bg-neon-purple/5'
                : 'border-border-subtle hover:border-neon-purple/30 bg-bg-elevated'
            }`}
          >
            <UploadCloud size={16} className={vrdFile ? 'text-neon-purple' : 'text-text-muted'} />
            <div className="flex-1 min-w-0">
              {vrdFile ? (
                <p className="text-xs text-neon-purple font-semibold truncate">{vrdFile.name}</p>
              ) : (
                <p className="text-xs text-text-muted">Subir archivo PDF de certificado VRD</p>
              )}
            </div>
            {vrdFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onVrdFileChange(null)
                  if (vrdInputRef.current) vrdInputRef.current.value = ''
                }}
                className="text-text-muted hover:text-red-400 transition-colors p-1"
                title="Quitar archivo"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <input
            ref={vrdInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleVrdFileChange}
            className="hidden"
          />
        </div>

        {/* Link / URL del certificado */}
        <div className="space-y-1">
          <div className="relative">
            <input
              type="url"
              value={vrdCertificateUrl}
              onChange={(e) => onVrdCertificateUrlChange(e.target.value)}
              placeholder="Enlace al certificado de VRD (Drive, OneDrive o web)..."
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-neon-purple focus:outline-none transition-all"
            />
            <LinkIcon size={12} className="absolute left-2.5 top-2.5 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Observaciones adicionales */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Observaciones adicionales
        </label>
        <textarea
          value={observaciones}
          onChange={(e) => onObservacionesChange(e.target.value)}
          placeholder="Agregar observaciones finales del servicio (opcional)..."
          rows={2}
          className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,229,255,0.2)] focus:outline-none transition-all resize-none"
        />
      </div>
    </div>
  )
}
