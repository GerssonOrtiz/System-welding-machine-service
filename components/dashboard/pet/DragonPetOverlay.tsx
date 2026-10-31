// components/dashboard/pet/DragonPetOverlay.tsx
'use client'

import React, { useState, useEffect, useCallback, useTransition } from 'react'
import { PixelToothlessDragon } from './PixelToothlessDragon'
import { DragonSpeechBubble } from './DragonSpeechBubble'
import { useDragonAI } from './useDragonAI'
import { DragonDialogue } from './types'
import { useDashboardStats } from '@/hooks/useEquipmentList'

const FUN_QUOTES = [
  '¡Huele a plasma fresco por aquí!',
  '¿Alguien tiene electrodos 7018 de sobra?',
  '¡Cuidado con la escoria caliente!',
  'Recuerden usar careta con sombra 11 🥽',
  '¡El gas argón está en su punto perfecto!',
  'Un cordón de soldadura bien parejito es arte.',
  'Verificando calibración de amperaje... ⚡',
]

export function DragonPetOverlay() {
  const {
    preference,
    action,
    direction,
    coords,
    frameStep,
    isBlinking,
    isDragging,
    handleDragStart,
    triggerPoke,
    updatePreference,
  } = useDragonAI()

  const { stats } = useDashboardStats()
  const [dialogue, setDialogue] = useState<DragonDialogue | null>(null)
  const [mounted, setMounted] = useState(false)
  const [, startTransition] = useTransition()

  // Evitar desajustes de hidratación SSR
  useEffect(() => {
    startTransition(() => {
      setMounted(true)
    })
  }, [])

  // Mostrar mensaje de diálogo
  const showBubble = useCallback((text: string, type: 'fun' | 'tip' | 'alert' | 'snack') => {
    const newDialogue: DragonDialogue = {
      id: Math.random().toString(),
      text,
      type,
      timestamp: Date.now(),
    }
    setDialogue(newDialogue)

    setTimeout(() => {
      setDialogue((current) => (current?.id === newDialogue.id ? null : current))
    }, 4500)
  }, [])

  // Reacciones contextuales según acción del dragón
  useEffect(() => {
    if (action === 'spark') {
      showBubble('¡Oops! ¡Se me escapó una chispita TIG!', 'fun')
    } else if (action === 'snack') {
      showBubble('¡Mmm! Pescadito asado al arco eléctrico 🐟', 'snack')
    } else if (action === 'tumble') {
      showBubble('¡Upa! ¡Casi tropiezo con un cable a tierra!', 'fun')
    }
  }, [action, showBubble])

  // Alertas inteligentes sobre equipos del taller (cada 45 segundos)
  useEffect(() => {
    if (preference !== 'active' || !stats) return

    const statsTimer = setInterval(() => {
      if (stats.delayedCount && stats.delayedCount > 0) {
        showBubble(
          `¡Atención! Hay ${stats.delayedCount} máquina(s) con retraso en el taller.`,
          'alert'
        )
      } else if (stats.activeCount && stats.activeCount > 0) {
        showBubble(
          `Tenemos ${stats.activeCount} equipos en mantenimiento activo. ¡A darle con ganas! 🛠️`,
          'tip'
        )
      } else {
        const randomQuote = FUN_QUOTES[Math.floor(Math.random() * FUN_QUOTES.length)]
        showBubble(randomQuote, 'fun')
      }
    }, 45000)

    return () => clearInterval(statsTimer)
  }, [preference, stats, showBubble])

  if (!mounted || preference === 'hidden') {
    return null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    // Solo clic izquierdo inicia drag
    if (e.button === 0) {
      handleDragStart(e.clientX, e.clientY)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    // Click derecho abre opción rápida de dormir o despertar
    if (preference === 'sleep') {
      updatePreference('active')
      showBubble('¡Desperté! Listo para ayudar.', 'fun')
    } else {
      updatePreference('sleep')
      showBubble('Zzz... Me echo una siestita en el banco de trabajo.', 'fun')
    }
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden select-none"
    >
      <div
        className="absolute pointer-events-auto transition-transform"
        style={{
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onClick={triggerPoke}
        onContextMenu={handleContextMenu}
        title="Chimuelo Shimeji — Arrastra con clic, o clic derecho para siesta"
      >
        {/* Globo de diálogo flotante */}
        <DragonSpeechBubble dialogue={dialogue} onDismiss={() => setDialogue(null)} />

        {/* Mascota en SVG Pixel Art */}
        <PixelToothlessDragon
          action={action}
          direction={direction}
          isBlinking={isBlinking}
          frameStep={frameStep}
          scale={2.2}
        />
      </div>
    </div>
  )
}
