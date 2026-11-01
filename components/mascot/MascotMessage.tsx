'use client';

import React from 'react';
import Link from 'next/link';
import { MascotKind, MascotMood, MASCOT_PROFILES, MOOD_LABELS } from './mascot-config';
import { X, Sparkles, ExternalLink } from 'lucide-react';

interface MascotMessageProps {
  kind: MascotKind;
  mood: MascotMood;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onClose: () => void;
  onToggleKind?: () => void;
}

export default function MascotMessage({
  kind,
  mood,
  message,
  actionLabel,
  actionHref,
  onClose,
  onToggleKind,
}: MascotMessageProps) {
  const config = MASCOT_PROFILES[kind];

  return (
    <div
      className="w-80 sm:w-88 rounded-2xl p-4 shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-slide-in relative select-none"
      style={{
        backgroundColor: 'rgba(12, 17, 32, 0.88)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        boxShadow: `0 12px 32px -4px rgba(0, 0, 0, 0.5), 0 0 24px -6px ${config.glowColor}`,
      }}
    >
      {/* Cabecera con datos de la mascota */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: config.accentColor }}
          />
          <div>
            <h4 className="text-xs font-semibold text-text-primary tracking-wide flex items-center gap-1.5">
              {config.name}
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-white/5 text-text-secondary border border-white/5">
                {MOOD_LABELS[mood]}
              </span>
            </h4>
            <p className="text-[10px] text-text-secondary font-mono">{config.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onToggleKind && (
            <button
              onClick={onToggleKind}
              className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-[10px] flex items-center gap-1 px-1.5"
              title="Cambiar compañero"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Alternar</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
            title="Cerrar panel"
            aria-label="Cerrar panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cuerpo del mensaje */}
      <p className="text-xs text-text-secondary leading-relaxed mb-3">
        {message}
      </p>

      {/* Acción opcional */}
      {actionLabel && actionHref && (
        <div className="pt-2 border-t border-white/5 flex justify-end">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
            style={{
              backgroundColor: `${config.accentColor}18`,
              color: config.accentColor,
              border: `1px solid ${config.accentColor}33`,
            }}
          >
            <span>{actionLabel}</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
