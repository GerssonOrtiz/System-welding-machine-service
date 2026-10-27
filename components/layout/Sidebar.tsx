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
  const [isHovered, setIsHovered] = useState(false)

  // ── Skeleton de carga ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <aside className="w-[76px] my-3 ml-3 rounded-3xl vision-sidebar-capsule p-4 hidden md:flex flex-col gap-4 font-sans select-none animate-pulse">
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`vision-sidebar-capsule md:my-auto md:ml-3 md:rounded-3xl flex flex-col justify-between font-sans selection:bg-amber-core selection:text-bg-forge select-none shrink-0 transition-[width,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          /* En móvil: posición fija deslizable tipo drawer */
          fixed inset-y-0 left-0 z-50 md:static md:translate-y-0 md:max-h-[88vh]
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          /* Ancho: en móvil 240px; en escritorio 76px colapsado y w-max al hacer hover (desplaza el contenido al expandir) */
          w-[240px] md:w-[76px] ${isHovered ? 'md:w-max md:shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_30px_rgba(0,210,255,0.18)]' : ''}
        `}
      >
      {/* ── Cuerpo superior: logo + navegación ───────────────────────────── */}
      <div className="flex flex-col overflow-hidden relative z-10 p-2 sm:p-2.5">
        {/* Logo Synapse estilo cápsula Vision Pro */}
        <div className={`flex items-center px-2 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-2 overflow-hidden transition-all duration-300 ${isHovered ? 'justify-start px-3' : 'justify-center'}`}>
          <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
            <Image
              src="/synapse_logo.png"
              alt="Synapse"
              width={32}
              height={32}
              className="object-contain max-h-8 w-auto filter drop-shadow-[0_0_10px_rgba(0,210,255,0.4)]"
            />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap ${isHovered ? 'max-w-[200px] opacity-100 ml-2.5' : 'max-w-0 opacity-0 ml-0 md:block hidden'}`}>
            <span className="font-bold text-base tracking-wider bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent font-mono">
              SYNAPSE
            </span>
          </div>
        </div>

        {/* Lista de navegación en burbujas */}
        <nav className="space-y-1.5 overflow-hidden py-1">
          <div className={`px-2.5 mb-1 transition-all duration-300 overflow-hidden whitespace-nowrap ${isHovered ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0 md:block hidden'}`}>
            <span className="text-[10px] text-cyan-400/70 font-semibold tracking-wider uppercase font-mono">
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
                prefetch={true}
                onClick={onMobileClose}
                title={!isHovered ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium vision-item-bubble w-full ${
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
                  className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap text-sm font-medium tracking-tight pr-2 ${
                    isHovered
                      ? 'max-w-[240px] opacity-100 translate-x-0'
                      : 'max-w-0 opacity-0 -translate-x-2 md:inline-block hidden'
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
      <div className="p-2.5 relative z-10">
        <div className={`flex items-center gap-2.5 p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-all overflow-hidden ${isHovered ? 'justify-start px-2' : 'justify-center'}`}>
          <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center text-xs font-bold shrink-0 shadow-[0_0_12px_rgba(0,210,255,0.25)]">
            {initial}
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap pr-2 ${isHovered ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0 md:block hidden'}`}>
            <p className="text-xs font-semibold text-slate-100 truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-cyan-400/80 truncate leading-tight mt-0.5 font-mono">
              {displayRole}
            </p>
          </div>
        </div>
      </div>
    </aside>
    </>
  )
}
