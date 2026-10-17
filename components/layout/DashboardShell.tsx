// components/layout/DashboardShell.tsx
// Componente cliente responsable del estado del menú móvil y el layout visual.
// Extraído de (dashboard)/layout.tsx para que el layout pueda ser Server Component.
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Cerrar menú móvil automáticamente si cambia la ruta
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen flex flex-col bg-bg-forge text-text-forge font-sans antialiased selection:bg-amber-core selection:text-bg-forge relative overflow-hidden">
      {/* ── Capa de Fondo: Gráficos de profundidad, Burbujas de Luz y Marca de Agua SYNAPSE ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Si el usuario coloca un archivo en /public/wallpaper.png o wallpaper.jpg, se activa automáticamente como fondo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 mix-blend-screen"
          style={{ backgroundImage: "url('/wallpaper.png'), url('/wallpaper.jpg')" }}
        />

        {/* Marca de agua elegante central con el isotipo de Synapse en baja opacidad */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] opacity-[0.035] select-none pointer-events-none flex items-center justify-center">
          <img
            src="/synapse_logo.png"
            alt="SYNAPSE Watermark"
            className="w-full h-full object-contain filter invert drop-shadow-[0_0_80px_rgba(0,210,255,0.8)]"
          />
        </div>

        {/* ── Burbujas de degradado flotantes (Dark Aurora / Cyber Orbs) ── */}
        {/* Burbuja 1: Cyan / Arc plasma superior izquierda */}
        <div className="absolute -top-[10%] left-[8%] w-[580px] h-[580px] rounded-full bg-gradient-to-br from-cyan-500/10 via-sky-600/5 to-transparent blur-[120px] animate-float-1" />

        {/* Burbuja 2: Deep Cobalt / Indigo central derecha */}
        <div className="absolute top-[28%] -right-[5%] w-[680px] h-[680px] rounded-full bg-gradient-to-bl from-indigo-600/12 via-blue-500/6 to-transparent blur-[140px] animate-float-2" />

        {/* Burbuja 3: Violeta oscuro / Púrpura inferior izquierda */}
        <div className="absolute -bottom-[15%] left-[25%] w-[720px] h-[720px] rounded-full bg-gradient-to-tr from-purple-700/8 via-cyan-500/5 to-transparent blur-[150px] animate-float-3" />

        {/* Micro-malla técnica de fondo estilo terminal Linux / tiling WM */}
        <div className="absolute inset-0 linux-grid-bg opacity-60" />
      </div>

      {/* Navbar superior con efecto glass real */}
      <Navbar
        onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Contenedor principal con Sidebar y Contenido de Rutas */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar lateral de navegación */}
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Contenido principal — fondo transparente para dejar pasar el efecto glass */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  )
}
