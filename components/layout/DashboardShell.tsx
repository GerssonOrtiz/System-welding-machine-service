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
      {/* Luces Ambientales de Fondo (Ambient Backlight Orbs) para dar vida al Glassmorphism */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Glow cálido ámbar superior izquierdo */}
        <div className="absolute -top-[15%] left-[5%] w-[650px] h-[650px] rounded-full bg-amber-500/[0.07] blur-[140px]" />
        {/* Glow frío azul/cian profundo inferior derecho (estilo Linux Desktop / Wayland) */}
        <div className="absolute top-[35%] right-[-10%] w-[750px] h-[750px] rounded-full bg-sky-500/[0.05] blur-[160px]" />
        {/* Glow central sutil violeta/naranja */}
        <div className="absolute -bottom-[20%] left-[30%] w-[800px] h-[600px] rounded-full bg-orange-600/[0.04] blur-[180px]" />
        {/* Micro-malla técnica de fondo estilo terminal Linux */}
        <div className="absolute inset-0 linux-grid-bg opacity-70" />
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
