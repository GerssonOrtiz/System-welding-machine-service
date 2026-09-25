// app/(dashboard)/layout.tsx
'use client'

import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { useUser } from '@/hooks/useUser'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Cerrar menú móvil automáticamente si cambia la ruta
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    // Si ya terminó de cargar el usuario y no hay sesión activa, redirigir a Login
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex-1 flex flex-col items-center justify-center bg-bg-base font-sans antialiased text-text-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-neon-blue/20 border-t-neon-blue rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-semibold font-mono">Autenticando sesión...</p>
        </div>
      </div>
    )
  }

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

        {/* Contenedor del contenido principal - padding optimizado para móvil */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-bg-base">
          {children}
        </main>
      </div>
    </div>
  )
}
