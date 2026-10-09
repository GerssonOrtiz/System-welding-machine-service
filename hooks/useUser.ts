// hooks/useUser.ts
// Hook para obtener el usuario autenticado y su perfil en user_profiles desde componentes cliente.
// PATRÓN CORRECTO: usar SOLO onAuthStateChange (event: INITIAL_SESSION) como fuente de verdad.
// No llamar getSession() en paralelo — genera race conditions y loading infinito.
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/user'
import type { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    async function loadUserProfile(userId: string) {
      try {
        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('[useUser] Error fetching profile:', error.message)
        }
        if (isMounted) {
          setProfile(profileData || null)
        }
      } catch (err) {
        console.error('[useUser] Unexpected error fetching profile:', err)
        if (isMounted) {
          setProfile(null)
        }
      }
    }

    // onAuthStateChange dispara INITIAL_SESSION inmediatamente con la sesión actual
    // (desde localStorage/cookies). Es la única fuente de verdad — no llamar getSession()
    // en paralelo para evitar race conditions que dejan loading=true indefinidamente.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return
        try {
          if (session?.user) {
            setUser(session.user)
            await loadUserProfile(session.user.id)
          } else {
            setUser(null)
            setProfile(null)
          }
        } catch (err) {
          console.error('[useUser] Error in onAuthStateChange:', err)
          if (isMounted) {
            setUser(null)
            setProfile(null)
          }
        } finally {
          // SIEMPRE desactivar loading, independientemente del resultado
          if (isMounted) {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    profile,
    role: profile?.role ?? null,
    isActive: profile?.is_active ?? false,
    isSuperadmin: profile?.is_superadmin ?? false,
    loading,
  }
}
