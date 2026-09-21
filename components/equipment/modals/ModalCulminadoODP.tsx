// components/equipment/modals/ModalCulminadoODP.tsx
'use client'

import React from 'react'
import { CheckCircle } from 'lucide-react'

interface ModalCulminadoODPProps {
  observaciones: string
  onObservacionesChange: (v: string) => void
}

const TEXTO_PREDEFINIDO =
  'Nos complace informarles que el servicio ha sido completado satisfactoriamente. El equipo ha pasado el control de calidad y se encuentra en óptimas condiciones, listo para ser retirado por el cliente.'

export default function ModalCulminadoODP({
  observaciones,
  onObservacionesChange,
}: ModalCulminadoODPProps) {
  return (
    <div className="space-y-4 pt-3 border-t border-neon-blue/20">
      <p className="text-[10px] font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
        <CheckCircle size={12} /> Servicio Culminado — Correo ODP
      </p>

      {/* Texto predefinido (solo lectura) */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          Mensaje del correo (predefinido)
        </label>
        <div className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2.5 text-xs text-text-muted italic leading-relaxed">
          {TEXTO_PREDEFINIDO}
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
          rows={3}
          className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,229,255,0.2)] focus:outline-none transition-all resize-none"
        />
      </div>
    </div>
  )
}
