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
    <div className="min-h-screen flex flex-col bg-bg-base text-text-primary font-sans antialiased">
      {/* Navbar superior */}
      <Navbar
        onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Contenedor principal con Sidebar y Contenido de Rutas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar lateral de navegación (oculto en móvil salvo que se despliegue) */}
        <Sidebar
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Contenido principal — padding optimizado para móvil */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-bg-base">
          {children}
        </main>
      </div>
    </div>
  )
}
