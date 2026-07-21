// components/layout/Navbar.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS } from '@/types/user'
import { toast } from 'sonner'

export function Navbar() {
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
    <header className="h-14 bg-bg-surface border-b border-white/6 px-6 flex items-center justify-between sticky top-0 z-40 selection:bg-neon-blue selection:text-bg-base font-sans">
      {/* Sección Izquierda: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-neon-blue/10 border border-neon-blue/20 text-neon-blue font-mono font-bold text-sm">
          CL
        </div>
        <span className="font-bold tracking-wider text-sm text-text-primary uppercase">
          CABELAB <span className="text-neon-blue font-mono font-normal"></span>
        </span>
      </div>

      {/* Sección Derecha: Información de usuario y Logout */}
      <div className="flex items-center gap-4">
        {/* Info del usuario actual */}
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-semibold text-text-primary font-mono leading-none mb-0.5">
            {profile?.username || user?.email?.split('@')[0] || 'Cargando...'}
          </span>
          <span className="text-[10px] text-text-secondary uppercase tracking-widest leading-none font-semibold">
            {role ? ROLE_LABELS[role] : 'Invitado'}
          </span>
        </div>

        {/* Separador */}
        <div className="h-6 w-[1px] bg-white/6 hidden sm:block" />

        {/* Botón Logout */}
        <button
          onClick={handleLogout}
          className="bg-transparent border border-red-500/30 hover:border-red-500 text-red-500 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-standard hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
        >
          SALIR
        </button>
      </div>
    </header>
  )
}
