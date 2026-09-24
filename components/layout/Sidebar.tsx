// components/layout/Sidebar.tsx
'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SIDEBAR_ITEMS_BY_ROLE, ROLE_LABELS } from '@/types/user'
import Image from 'next/image'
import {
  LayoutDashboard,
  Kanban,
  Wrench,
  Package,
  Search,
  History,
  GitMerge,
  BookOpen,
  BarChart2,
  Dna,
  UserCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Definición de ítems del sidebar con íconos Lucide
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarItem {
  key: string
  label: string
  href: string
  icon: LucideIcon
}

const ALL_SIDEBAR_ITEMS: Record<string, SidebarItem> = {
  usuarios: {
    key: 'usuarios',
    label: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
  },
  dashboard: {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  pizarra: {
    key: 'pizarra',
    label: 'Pizarra',
    href: '/pizarra',
    icon: Kanban,
  },
  equipos: {
    key: 'equipos',
    label: 'Equipos',
    href: '/equipos',
    icon: Package,
  },
  taller: {
    key: 'taller',
    label: 'Taller',
    href: '/taller',
    icon: Wrench,
  },
  historial: {
    key: 'historial',
    label: 'Historial',
    href: '/historial',
    icon: History,
  },
  buscar: {
    key: 'buscar',
    label: 'Buscar',
    href: '/buscar',
    icon: Search,
  },
  workflow: {
    key: 'workflow',
    label: 'Workflow',
    href: '/admin/workflow',
    icon: GitMerge,
  },
  catalogo: {
    key: 'catalogo',
    label: 'Catálogo',
    href: '/admin/catalog',
    icon: BookOpen,
  },
  estadisticas: {
    key: 'estadisticas',
    label: 'Estadísticas',
    href: '/estadisticas',
    icon: BarChart2,
  },
  dna: {
    key: 'dna',
    label: 'DNA Equipo',
    href: '/dna',
    icon: Dna,
  },
  perfil: {
    key: 'perfil',
    label: 'Mi Perfil',
    href: '/perfil',
    icon: UserCircle,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { profile, role, loading } = useUser()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // ── Skeleton de carga ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <aside className="w-[220px] bg-bg-surface border-r border-white/6 p-4 hidden md:flex flex-col gap-4 font-sans select-none animate-pulse">
        <div className="h-8 bg-white/5 rounded w-3/4 mb-4" />
        <div className="space-y-3">
          <div className="h-8 bg-white/5 rounded" />
          <div className="h-8 bg-white/5 rounded" />
          <div className="h-8 bg-white/5 rounded" />
          <div className="h-8 bg-white/5 rounded" />
        </div>
      </aside>
    )
  }

  // ── Navegación según rol ───────────────────────────────────────────────────
  const allowedKeys = role ? SIDEBAR_ITEMS_BY_ROLE[role] : []
  const navigationItems = allowedKeys
    .map((key) => ALL_SIDEBAR_ITEMS[key])
    .filter(Boolean)

  // ── Datos del usuario para el pie ─────────────────────────────────────────
  const displayName = profile?.full_name || profile?.username || '—'
  const displayRole = role ? ROLE_LABELS[role] : ''
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <aside
      className={`bg-bg-surface border-r border-white/6 flex flex-col justify-between font-sans selection:bg-neon-blue selection:text-bg-base select-none shrink-0 transition-all duration-300 relative ${
        isCollapsed ? 'w-[70px]' : 'w-[220px]'
      }`}
    >
      {/* ── Botón para colapsar ───────────────────────────────────────────── */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        className="absolute -right-3 top-10 w-6 h-6 bg-bg-surface border border-white/10 rounded-full flex items-center justify-center text-text-secondary hover:text-neon-blue hover:border-neon-blue transition-all z-10 shadow-lg"
      >
        {isCollapsed
          ? <ChevronRight size={12} />
          : <ChevronLeft size={12} />
        }
      </button>

      {/* ── Cuerpo superior: logo + navegación ───────────────────────────── */}
      <div className="flex flex-col overflow-hidden">
        {/* Logo Synapse */}
        <div className={`flex flex-col items-center px-3 py-4 border-b border-white/6 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
          {isCollapsed ? (
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Image
                src="/synapse_logo.png"
                alt="Synapse"
                width={32}
                height={32}
                className="object-contain max-h-8 w-auto"
              />
            </div>
          ) : (
            <div className="w-full flex flex-col gap-2.5">
              <div className="relative w-full h-8 flex items-center">
                <Image
                  src="/synapse_horizontal.png"
                  alt="Synapse"
                  width={150}
                  height={34}
                  className="object-contain max-h-8 w-auto"
                />
              </div>

              {/* Tag descriptivo de servicio para Cabelab */}
              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white/4 border border-white/6 rounded-md">
                <div className="relative h-5 w-24 flex items-center">
                  <Image
                    src="/cabelab.png"
                    alt="CABELAB"
                    width={96}
                    height={20}
                    className="object-contain max-h-5 w-auto"
                  />
                </div>
                <span className="text-[8px] text-text-muted font-mono leading-none text-right">
                  Motosoldadoras
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Lista de navegación */}
        <nav className="p-3 space-y-0.5 overflow-hidden">
          <div className={`px-2 mb-3 mt-1 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 h-0 mb-0' : 'opacity-100'}`}>
            <span className="text-[9px] text-text-muted font-bold tracking-widest uppercase font-mono whitespace-nowrap">
              Navegación
            </span>
          </div>

          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-standard ${
                  isActive
                    ? 'bg-neon-blue/8 border border-neon-blue/20 text-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.05)]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/3 border border-transparent'
                }`}
              >
                <Icon
                  size={16}
                  className="shrink-0"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`transition-opacity duration-200 whitespace-nowrap text-sm ${
                    isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ── Pie: avatar + nombre + rol del usuario ───────────────────────── */}
      <div className={`border-t border-white/6 transition-all duration-200 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {isCollapsed ? (
          /* Modo colapsado: solo el avatar */
          <div className="flex justify-center">
            <div
              title={displayName}
              className="w-8 h-8 rounded-full bg-neon-blue/15 border border-neon-blue/25 flex items-center justify-center text-xs font-bold text-neon-blue"
            >
              {initial}
            </div>
          </div>
        ) : (
          /* Modo expandido: avatar + info */
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-neon-blue/15 border border-neon-blue/25 flex items-center justify-center text-xs font-bold text-neon-blue shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-text-muted truncate leading-tight mt-0.5 font-mono">
                {displayRole}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
