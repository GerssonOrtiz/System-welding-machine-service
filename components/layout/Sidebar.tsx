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
  Calculator,
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
  pronostico: {
    key: 'pronostico',
    label: 'Pronóstico',
    href: '/auditoria-modelos',
    icon: Calculator,
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

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const { profile, role, loading } = useUser()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // ── Skeleton de carga ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <aside className="w-[230px] my-3 ml-3 rounded-3xl vision-sidebar-capsule p-4 hidden md:flex flex-col gap-4 font-sans select-none animate-pulse">
        <div className="h-8 bg-amber-core/5 rounded-full w-3/4 mb-4" />
        <div className="space-y-3">
          <div className="h-9 bg-amber-core/5 rounded-2xl" />
          <div className="h-9 bg-amber-core/5 rounded-2xl" />
          <div className="h-9 bg-amber-core/5 rounded-2xl" />
          <div className="h-9 bg-amber-core/5 rounded-2xl" />
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
    <>
      {/* Overlay oscuro de fondo para celular cuando la navegación esté abierta */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside
        className={`vision-sidebar-capsule md:my-3 md:ml-3 md:rounded-3xl flex flex-col justify-between font-sans selection:bg-amber-core selection:text-bg-forge select-none shrink-0 transition-all duration-300
          /* En móvil: posición fija deslizable tipo drawer */
          fixed inset-y-0 left-0 z-50 md:static md:translate-x-0
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          /* En móvil siempre ancho completo (240px), en escritorio según isCollapsed */
          w-[240px] ${isCollapsed ? 'md:w-[76px]' : 'md:w-[230px]'}
        `}
      >
        {/* ── Botón para colapsar en escritorio (oculto en móvil) ─────────────── */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          className="hidden md:flex absolute -right-3 top-10 w-7 h-7 rounded-full bg-slate-900/90 border border-white/20 items-center justify-center text-text-forge-mid hover:text-cyan-400 hover:border-cyan-400/50 hover:scale-110 transition-all z-20 shadow-xl shadow-black/60 backdrop-blur-md"
        >
          {isCollapsed
            ? <ChevronRight size={13} />
            : <ChevronLeft size={13} />
          }
        </button>

      {/* ── Cuerpo superior: logo + navegación ───────────────────────────── */}
      <div className="flex flex-col overflow-hidden relative z-10 p-2 sm:p-2.5">
        {/* Logo Synapse estilo cápsula Vision Pro */}
        <div className={`flex flex-col items-center px-2 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
          {isCollapsed ? (
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Image
                src="/synapse_logo.png"
                alt="Synapse"
                width={32}
                height={32}
                className="object-contain max-h-8 w-auto filter drop-shadow-[0_0_10px_rgba(0,210,255,0.4)]"
              />
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <div className="relative w-full h-8 flex items-center justify-center">
                <Image
                  src="/synapse_horizontal.png"
                  alt="Synapse"
                  width={140}
                  height={32}
                  className="object-contain max-h-8 w-auto filter drop-shadow-[0_0_12px_rgba(0,210,255,0.3)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Lista de navegación en burbujas */}
        <nav className="space-y-1.5 overflow-hidden py-1">
          <div className={`px-2.5 mb-2 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 h-0 mb-0' : 'opacity-100'}`}>
            <span className="text-[10px] text-cyan-400/70 font-semibold tracking-wider uppercase font-mono whitespace-nowrap">
              Apps & Vistas
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
                onClick={onMobileClose}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium vision-item-bubble ${
                  isActive
                    ? 'vision-item-bubble-active text-cyan-300'
                    : 'text-slate-300 hover:text-white bg-white/[0.02] border border-transparent'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    isActive
                      ? 'bg-cyan-400/20 text-cyan-300 shadow-[0_0_12px_rgba(0,210,255,0.4)]'
                      : 'bg-white/[0.04] text-slate-400 group-hover:text-white'
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={`transition-opacity duration-200 whitespace-nowrap text-sm font-medium tracking-tight ${
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

      {/* ── Pie: avatar + nombre + rol del usuario estilo cápsula flotante ── */}
      <div className={`p-2.5 relative z-10`}>
        {isCollapsed ? (
          /* Modo colapsado: solo el avatar en burbuja */
          <div className="flex justify-center">
            <div
              title={displayName}
              className="w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 flex items-center justify-center text-xs font-bold shadow-[0_0_14px_rgba(0,210,255,0.25)] hover:scale-105 transition-all"
            >
              {initial}
            </div>
          </div>
        ) : (
          /* Modo expandido: burbuja completa de perfil */
          <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-all">
            <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center text-xs font-bold shrink-0 shadow-[0_0_12px_rgba(0,210,255,0.25)]">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-cyan-400/80 truncate leading-tight mt-0.5 font-mono">
                {displayRole}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
