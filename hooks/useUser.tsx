// hooks/useUser.ts
// Contexto de usuario + hook useUser().
// Arquitectura: el Server Component del layout valida la sesión y pasa los datos
// al UserProvider. El cliente NO hace ningún async auth check — loading siempre es false.
'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/user'
import type { User } from '@supabase/supabase-js'

// ─── Tipo del contexto ────────────────────────────────────────────────────────

export interface UserContextValue {
  user: User | null
  profile: UserProfile | null
  role: UserProfile['role'] | null
  isActive: boolean
  isSuperadmin: boolean
  /** Siempre false cuando se usa dentro de un layout autenticado server-side */
  loading: boolean
}

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  role: null,
  isActive: false,
  isSuperadmin: false,
  loading: false,
})

// ─── Provider ─────────────────────────────────────────────────────────────────

interface UserProviderProps {
  initialUser: User
  initialProfile: UserProfile
  children: ReactNode
}

/**
 * Proveedor de contexto de usuario.
 * Recibe `initialUser` e `initialProfile` ya validados por el Server Component
 * del layout — no hay estado de carga. Solo escucha `onAuthStateChange` para
 * detectar cierre de sesión o refresco de token en segundo plano.
 */
export function UserProvider({
  initialUser,
  initialProfile,
  children,
}: UserProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)

  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Token refrescado — actualizar objeto de usuario; perfil no cambia
        setUser(session.user)
      } else {
        // Sesión expirada o signOut explícito
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        isActive: profile?.is_active ?? false,
        isSuperadmin: profile?.is_superadmin ?? false,
        loading: false,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Retorna los datos del usuario autenticado desde el contexto.
 * Debe usarse dentro de componentes descendientes de <UserProvider>.
 */
export function useUser(): UserContextValue {
  return useContext(UserContext)
}
