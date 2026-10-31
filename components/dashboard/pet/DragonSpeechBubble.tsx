// components/dashboard/pet/DragonSpeechBubble.tsx
'use client'

import React from 'react'
import { DragonDialogue } from './types'

interface DragonSpeechBubbleProps {
  dialogue: DragonDialogue | null
  onDismiss?: () => void
}

export function DragonSpeechBubble({ dialogue, onDismiss }: DragonSpeechBubbleProps) {
  if (!dialogue) return null

  const isAlert = dialogue.type === 'alert'
  const isSnack = dialogue.type === 'snack'

  return (
    <div
      onClick={onDismiss}
      className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-auto cursor-pointer max-w-[210px] w-max select-none animate-in fade-in slide-in-from-bottom-2 duration-200 ${
        isAlert
          ? 'bg-red-950/90 border-red-500/60 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.35)]'
          : isSnack
          ? 'bg-amber-950/90 border-amber-500/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
          : 'bg-slate-900/90 border-cyan-500/50 text-cyan-100 shadow-[0_0_15px_rgba(0,210,255,0.3)]'
      } backdrop-blur-md border rounded-xl px-3 py-2 text-xs font-mono leading-tight`}
    >
      <div className="flex items-start gap-1.5">
        <span className="text-sm shrink-0">
          {isAlert ? '⚠️' : isSnack ? '🐟' : '⚡'}
        </span>
        <p className="text-[11px] font-sans font-medium">{dialogue.text}</p>
      </div>

      {/* Triángulo indicador de la burbuja hacia la cabeza del dragón */}
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 ${
          isAlert
            ? 'border-t-red-500/60'
            : isSnack
            ? 'border-t-amber-500/60'
            : 'border-t-cyan-500/50'
        }`}
      />
    </div>
  )
}
