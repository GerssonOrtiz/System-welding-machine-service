// components/dashboard/pet/DragonToggleNavbar.tsx
'use client'

import React, { useState, useEffect, useTransition } from 'react'
import {
  DragonPetPreference,
  DRAGON_STORAGE_KEY,
  DRAGON_TOGGLE_EVENT,
} from './types'

export function DragonToggleNavbar() {
  const [preference, setPreference] = useState<DragonPetPreference>('active')
  const [isOpenMenu, setIsOpenMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    startTransition(() => {
      setMounted(true)
    })
    try {
      const saved = localStorage.getItem(DRAGON_STORAGE_KEY) as DragonPetPreference | null
      if (saved && ['active', 'sleep', 'hidden'].includes(saved)) {
        setPreference(saved)
      }
    } catch {}

    const handleCustom = (e: Event) => {
      const ce = e as CustomEvent<DragonPetPreference>
      if (ce.detail) {
        setPreference(ce.detail)
      }
    }

    window.addEventListener(DRAGON_TOGGLE_EVENT, handleCustom)
    return () => window.removeEventListener(DRAGON_TOGGLE_EVENT, handleCustom)
  }, [])

  const setPetState = (newPref: DragonPetPreference) => {
    setPreference(newPref)
    setIsOpenMenu(false)
    try {
      localStorage.setItem(DRAGON_STORAGE_KEY, newPref)
    } catch {}
    window.dispatchEvent(new CustomEvent(DRAGON_TOGGLE_EVENT, { detail: newPref }))
  }

  if (!mounted) return null

  // Etiqueta e ícono según estado
  const getBadge = () => {
    switch (preference) {
      case 'active':
        return { icon: '🐲', label: 'Chimuelo: Activo', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' }
      case 'sleep':
        return { icon: '💤', label: 'Chimuelo: Siesta', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
      case 'hidden':
        return { icon: '🕳️', label: 'Chimuelo: Cueva', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' }
    }
  }

  const badge = getBadge()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpenMenu((prev) => !prev)}
        aria-label="Ajustar estado de mascota dragón"
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-mono font-medium transition-all ${badge.color} hover:brightness-125`}
        title={`Mascota del Taller: ${badge.label}`}
      >
        <span className="text-sm select-none">{badge.icon}</span>
        <span className="hidden xl:inline text-[11px] font-sans capitalize">{preference}</span>
      </button>

      {/* Menú desplegable flotante */}
      {isOpenMenu && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900/95 border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-xl p-1.5 z-50 text-xs font-sans animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-white/5 mb-1">
            Mascota de Taller
          </div>

          <button
            onClick={() => setPetState('active')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
              preference === 'active'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                : 'text-slate-300 hover:bg-white/[0.06]'
            }`}
          >
            <span>🐲</span>
            <div className="flex flex-col">
              <span>Paseando (Activo)</span>
              <span className="text-[10px] text-slate-400 font-normal">Patrulla y chispitas</span>
            </div>
          </button>

          <button
            onClick={() => setPetState('sleep')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
              preference === 'sleep'
                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                : 'text-slate-300 hover:bg-white/[0.06]'
            }`}
          >
            <span>💤</span>
            <div className="flex flex-col">
              <span>Dormir (Siesta)</span>
              <span className="text-[10px] text-slate-400 font-normal">Descansa en el suelo</span>
            </div>
          </button>

          <button
            onClick={() => setPetState('hidden')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
              preference === 'hidden'
                ? 'bg-slate-700/40 text-slate-200 font-semibold'
                : 'text-slate-400 hover:bg-white/[0.06]'
            }`}
          >
            <span>🕳️</span>
            <div className="flex flex-col">
              <span>Guardar en cueva</span>
              <span className="text-[10px] text-slate-500 font-normal">Ocultar completamente</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
