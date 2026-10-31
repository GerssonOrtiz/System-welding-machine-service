// components/layout/Navbar.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS } from '@/types/user'
import { toast } from 'sonner'
import Image from 'next/image'
import { LogOut, Menu, X } from 'lucide-react'
import { DragonToggleNavbar } from '@/components/dashboard/pet/DragonToggleNavbar'

interface NavbarProps {
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export function Navbar({ onMenuToggle, isMobileMenuOpen }: NavbarProps) {
  const { user, profile, role, isSuperadmin } = useUser()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error('Error al cerrar sesión')
        return
      }
      toast.success('Sesión cerrada correctamente')
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Ocurrió un error inesperado al cerrar sesión')
    }
  }

  return (
    <header className="w-full px-4 pt-3 pb-1 md:px-6 md:pt-4 shrink-0 z-30 font-sans">
      <div className="w-full h-14 vision-sidebar-capsule rounded-2xl px-4 md:px-6 flex items-center justify-between border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Sección Izquierda: Botón hamburguesa móvil + Logo Synapse y autoría */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Botón toggle para celulares */}
          <button
            onClick={onMenuToggle}
            aria-label={isMobileMenuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
            className="md:hidden p-2 text-slate-300 hover:text-cyan-300 hover:bg-white/[0.06] rounded-xl border border-white/10 transition-colors flex items-center justify-center"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative h-7 w-24 md:w-28 flex items-center">
              <Image
                src="/synapse_horizontal.png"
                alt="SYNAPSE"
                width={140}
                height={35}
                priority
                className="object-contain max-h-7 w-auto filter drop-shadow-[0_0_10px_rgba(0,210,255,0.3)]"
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden lg:inline border-l border-white/10 pl-2.5">
              por <strong className="text-slate-200 font-medium">Br. Gersson Ortiz</strong>
            </span>
          </div>
        </div>

        {/* Sección Derecha: Selector de Mascota, Información de usuario y Logout */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Botón Mascota de Taller (Chimuelo Shimeji) */}
          <DragonToggleNavbar />

          {/* Info del usuario actual en burbuja sutil */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-100 font-sans leading-none mb-0.5">
                {profile?.full_name || profile?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Cargando...'}
              </span>
              <span className="text-[9px] text-cyan-400 font-mono uppercase tracking-wider leading-none">
                {role ? ROLE_LABELS[role] : 'Invitado'}
              </span>
            </div>
          </div>

          {/* Botón Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 text-red-400 text-xs font-semibold uppercase tracking-wider transition-all hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}
