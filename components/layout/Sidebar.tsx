// components/layout/Sidebar.tsx
import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SIDEBAR_ITEMS_BY_ROLE } from '@/types/user'

// Definición de ítems del sidebar completos (Rutas, Etiquetas e Iconos CSS)
interface SidebarItem {
  key: string
  label: string
  href: string
  icon: string // Usaremos caracteres unicode estilizados/símbolos industriales coherentes
}

const ALL_SIDEBAR_ITEMS: Record<string, SidebarItem> = {
  usuarios: {
    key: 'usuarios',
    label: 'Usuarios',
    href: '/admin/usuarios',
    icon: '👥',
  },
  dashboard: {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
  },
  pizarra: {
    key: 'pizarra',
    label: 'Pizarra',
    href: '/pizarra',
    icon: '📺',
  },
  equipos: {
    key: 'equipos',
    label: 'Equipos',
    href: '/equipos',
    icon: '🔧',
  },
  taller: {
    key: 'taller',
    label: 'Taller',
    href: '/taller',
    icon: '🛠️',
  },
  historial: {
    key: 'historial',
    label: 'Historial',
    href: '/historial',
    icon: '📜',
  },
  buscar: {
    key: 'buscar',
    label: 'Buscar',
    href: '/buscar',
    icon: '🔍',
  },
  workflow: {
    key: 'workflow',
    label: 'Workflow',
    href: '/admin/workflow',
    icon: '⚙️',
  },
  catalogo: {
    key: 'catalogo',
    label: 'Catálogo',
    href: '/admin/catalog',
    icon: '📦',
  },
  estadisticas: {
    key: 'estadisticas',
    label: 'Estadísticas',
    href: '/estadisticas',
    icon: '📈',
  },
  dna: {
    key: 'dna',
    label: 'DNA Equipo',
    href: '/dna',
    icon: '🧬',
  },
  perfil: {
    key: 'perfil',
    label: 'Mi perfil',
    href: '/perfil',
    icon: '👤',
  },
}

export function Sidebar() {
  const { role, loading } = useUser()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (loading) {
    return (
      <aside className="w-[200px] bg-bg-surface border-r border-white/6 p-4 hidden md:flex flex-col gap-4 font-sans select-none animate-pulse">
        <div className="h-4 bg-white/5 rounded w-3/4 mb-4" />
        <div className="space-y-3">
          <div className="h-8 bg-white/5 rounded" />
          <div className="h-8 bg-white/5 rounded" />
          <div className="h-8 bg-white/5 rounded" />
          <div className="h-8 bg-white/5 rounded" />
        </div>
      </aside>
    )
  }

  // Obtener las llaves de los ítems de navegación permitidos para el rol
  const allowedKeys = role ? SIDEBAR_ITEMS_BY_ROLE[role] : []

  // Mapear llaves a objetos de configuración de ítems
  const navigationItems = allowedKeys
    .map((key) => ALL_SIDEBAR_ITEMS[key])
    .filter(Boolean)

  return (
    <aside 
      className={`bg-bg-surface border-r border-white/6 flex flex-col justify-between font-sans selection:bg-neon-blue selection:text-bg-base select-none shrink-0 transition-all duration-300 relative ${
        isCollapsed ? 'w-[70px]' : 'w-[200px]'
      }`}
    >
      {/* Botón para colapsar */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 bg-bg-surface border border-white/10 rounded-full flex items-center justify-center text-[10px] text-text-secondary hover:text-neon-blue hover:border-neon-blue transition-all z-10 shadow-lg"
      >
        {isCollapsed ? '→' : '←'}
      </button>
      
      {/* Lista de navegación */}
      <nav className="p-4 space-y-1 overflow-hidden">
        <div className={`px-3 mb-4 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase font-mono whitespace-nowrap">
            Navegación
          </span>
        </div>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.key}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-standard ${
                isActive
                  ? 'bg-neon-blue/8 border border-neon-blue/20 text-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.05)]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/3 border border-transparent'
              }`}
            >
              <span className="text-base leading-none shrink-0">{item.icon}</span>
              <span className={`transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Info Pie de Sidebar */}
      <div className={`p-4 border-t border-white/6 transition-all duration-200 ${isCollapsed ? 'px-2' : 'p-4'}`}>
        <div className="bg-bg-base/40 border border-white/3 rounded-lg p-3 text-center overflow-hidden">
          <span className={`block text-[10px] text-text-muted font-mono leading-none whitespace-nowrap ${isCollapsed ? 'hidden' : 'block'}`}>
            ZONA HORARIA
          </span>
          <span className="block text-xs font-semibold text-text-secondary mt-1 font-mono">
            {isCollapsed ? 'PE' : 'America/Arequipa'}
          </span>
        </div>
      </div>

    </aside>
  )
}
