// app/(dashboard)/pizarra/page.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Maximize2, Minimize2 } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import PizarraBoard from '@/components/pizarra/PizarraBoard'

function LimaClock() {
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString('es-PE', {
          timeZone: 'America/Lima',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      )
      setDateStr(
        now.toLocaleDateString('es-PE', {
          timeZone: 'America/Lima',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      )
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-right font-mono select-none">
      <div className="text-neon-blue text-2xl font-bold tracking-widest leading-none">
        {timeStr}
      </div>
      <div className="text-text-secondary text-[11px] uppercase tracking-wide mt-0.5 capitalize">
        {dateStr} 
      </div>
    </div>
  )
}

export default function PizarraPage() {
  usePageTitle('Pizarra')
  const [isKioskMode, setIsKioskMode] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sincronizar el estado de pantalla completa si el usuario sale con ESC o por API del navegador
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = Boolean(document.fullscreenElement)
      setIsKioskMode(isDocFullscreen)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Cerrar modo quiosco con Escape también si no se usó Fullscreen API nativa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isKioskMode) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {})
        } else {
          setIsKioskMode(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isKioskMode])

  const toggleFullscreen = async () => {
    try {
      if (!isKioskMode) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen()
        }
        setIsKioskMode(true)
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
        setIsKioskMode(false)
      }
    } catch {
      // Fallback a modo quiosco CSS (fixed z-[100]) si la API nativa de fullscreen es bloqueada
      setIsKioskMode((prev) => !prev)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col font-sans text-text-primary transition-all duration-200 ${
        isKioskMode
          ? 'fixed inset-0 z-[100] bg-bg-forge p-4 overflow-y-auto'
          : 'min-h-full bg-transparent'
      }`}
    >
      {/* Header Pizarra */}
      <header className="flex justify-between items-center px-6 py-4 glass-card rounded-2xl mb-3 flex-shrink-0 border border-white/10 shadow-glass relative z-10">
        {/* Logo + título */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white/[0.04] border border-white/10 flex items-center justify-center p-1 shadow-inner">
            <Image
              src="/cabelab.png"
              alt="CABELAB"
              width={36}
              height={36}
              priority
              className="object-contain w-full h-full"
            />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider uppercase text-neon-blue font-mono leading-none">
              CABELAB
            </h1>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">
              Tablero de Control Operativo
            </p>
          </div>
        </div>

        {/* Acciones de Pizarra */}
        <div className="flex items-center gap-6">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/10 hover:border-cyan-400/60 hover:text-cyan-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm cursor-pointer select-none"
            title={isKioskMode ? 'Salir de pantalla completa (Esc)' : 'Activar pantalla completa'}
          >
            {isKioskMode ? (
              <>
                <Minimize2 size={13} className="text-cyan-400" />
                <span>Salir Pantalla Completa</span>
              </>
            ) : (
              <>
                <Maximize2 size={13} className="text-cyan-400" />
                <span>Pantalla Completa</span>
              </>
            )}
          </button>
          
          {/* Reloj Lima */}
          <LimaClock />
        </div>
      </header>

      {/* Indicadores rápidos */}
      <div className="flex items-center gap-3 px-4 py-2 glass-card rounded-xl mb-3 text-[10px] uppercase tracking-widest text-slate-400 font-mono flex-shrink-0 border border-white/[0.06]">
        <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse shadow-neon-blue inline-block" />
        Conexión Realtime Activa
        <span className="ml-auto">Actualización automática</span>
      </div>

      {/* Tablero Principal */}
      <main className="flex-1 overflow-hidden px-1 py-2 sm:px-4 sm:py-4">
        <PizarraBoard />
      </main>

      {/* Footer */}
      <footer className="flex justify-between px-6 py-2.5 glass-card rounded-xl mt-3 flex-shrink-0 text-[10px] text-slate-400 uppercase tracking-wider items-center font-mono border border-white/[0.06]">
        <span>Elaborado por Br. Gersson Ortiz </span>
        <span>Powered by Venllas</span>
      </footer>
    </div>
  )
}
