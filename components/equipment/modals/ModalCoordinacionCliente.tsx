// components/equipment/modals/ModalCoordinacionCliente.tsx
'use client'

import React from 'react'
import { Mail, MessageSquare } from 'lucide-react'

interface ModalCoordinacionClienteProps {
  sendEmail: boolean
  onSendEmailChange: (v: boolean) => void
  emailBody: string
  onEmailBodyChange: (v: string) => void
}

export default function ModalCoordinacionCliente({
  sendEmail,
  onSendEmailChange,
  emailBody,
  onEmailBodyChange,
}: ModalCoordinacionClienteProps) {
  return (
    <div className="space-y-4 pt-3 border-t border-neon-blue/20">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-neon-blue uppercase tracking-wider flex items-center gap-1.5">
          <MessageSquare size={12} /> Coordinación con el Cliente
        </p>
      </div>

      {/* Switch / Checkbox de enviar correo */}
      <div className="bg-bg-elevated/60 border border-border-subtle rounded-lg p-3 space-y-2">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => onSendEmailChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border-subtle bg-bg-surface text-neon-blue focus:ring-neon-blue/40 cursor-pointer"
          />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Mail size={13} className={sendEmail ? 'text-neon-blue' : 'text-text-muted'} />
              Enviar notificación por correo en el hilo
            </span>
            <p className="text-[11px] text-text-secondary leading-snug">
              Responde automáticamente en el hilo existente de correo informando los detalles de la coordinación.
            </p>
          </div>
        </label>
      </div>

      {/* Campo para redactar el cuerpo del correo si la opción está activa */}
      {sendEmail && (
        <div className="space-y-1.5 animate-in fade-in duration-150">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center justify-between">
            <span>Cuerpo del Correo *</span>
            <span className="text-[10px] text-neon-blue font-normal lowercase">se enviará con formato oficial</span>
          </label>
          <textarea
            value={emailBody}
            onChange={(e) => onEmailBodyChange(e.target.value)}
            placeholder="Escriba aquí los detalles o mensaje de la coordinación con el cliente..."
            rows={4}
            className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-blue focus:shadow-[0_0_8px_rgba(0,229,255,0.2)] focus:outline-none transition-all resize-none"
          />
        </div>
      )}
    </div>
  )
}
