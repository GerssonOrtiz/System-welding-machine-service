// hooks/useUser.ts
// Hook para obtener el usuario autenticado y su perfil en user_profiles desde componentes cliente
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/user'
import type { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    async function getSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return

        if (session) {
          setUser(session.user)
          // Buscar perfil
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (isMounted) {
            setProfile(profileData)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Error fetching user session/profile:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    // Suscribirse a cambios de estado de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        if (session) {
          setUser(session.user)
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (isMounted) {
            setProfile(profileData)
            setLoading(false)
          }
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return {
    user,
    profile,
    role: profile?.role ?? null,
    isActive: profile?.is_active ?? false,
    isSuperadmin: profile?.is_superadmin ?? false,
    loading,
  }
}
