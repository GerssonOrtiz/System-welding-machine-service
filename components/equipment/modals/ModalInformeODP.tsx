// components/equipment/modals/ModalInformeODP.tsx
'use client'

import React, { useRef } from 'react'
import { FileText, UploadCloud, X } from 'lucide-react'

interface ModalInformeODPProps {
  diagnostico: string
  onDiagnosticoChange: (v: string) => void
  pdfFile: File | null
  onPdfChange: (f: File | null) => void
  reportUrl?: string
  onReportUrlChange?: (v: string) => void
}

export default function ModalInformeODP({
  diagnostico,
  onDiagnosticoChange,
  pdfFile,
  onPdfChange,
  reportUrl = '',
  onReportUrlChange,
}: ModalInformeODPProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file && file.type !== 'application/pdf') {
      onPdfChange(null)
      return
    }
    onPdfChange(file)
  }

  return (
    <div className="space-y-4 pt-3 border-t border-neon-blue/20">
      <p className="text-[10px] font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
        <FileText size={12} /> Informe Técnico — Correo ODP
      </p>

      {/* Diagnóstico */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Diagnóstico técnico *
        </label>
        <textarea
          value={diagnostico}
          onChange={(e) => onDiagnosticoChange(e.target.value)}
          placeholder="Describe el diagnóstico técnico realizado al equipo..."
          rows={4}
          className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,229,255,0.2)] focus:outline-none transition-all resize-none"
        />
      </div>

      {/* PDF Upload */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Informe PDF *
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center gap-3 p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
            pdfFile
              ? 'border-neon-blue/50 bg-neon-blue/5'
              : 'border-border-subtle hover:border-neon-blue/30 bg-bg-elevated'
          }`}
        >
          <UploadCloud size={18} className={pdfFile ? 'text-neon-blue' : 'text-text-muted'} />
          <div className="flex-1 min-w-0">
            {pdfFile ? (
              <p className="text-xs text-neon-blue font-semibold truncate">{pdfFile.name}</p>
            ) : (
              <p className="text-xs text-text-muted">Haz clic para subir el informe en PDF</p>
            )}
          </div>
          {pdfFile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPdfChange(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="text-text-muted hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-[9px] text-text-muted">Solo archivos .pdf</p>
      </div>

      {/* Enlace Google Drive opcional */}
      {onReportUrlChange && (
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Enlace de Google Drive del informe (opcional para QR)
          </label>
          <input
            type="url"
            value={reportUrl}
            onChange={(e) => onReportUrlChange(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
            className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:outline-none transition-all font-mono"
          />
          <p className="text-[9px] text-text-muted">
            Este enlace se asociará al equipo y estará disponible al escanear la etiqueta QR física.
          </p>
        </div>
      )}
    </div>
  )
}
