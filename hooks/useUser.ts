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
          console.error('Error fetching user profile:', error)
        }

        if (isMounted) {
          setProfile(profileData || null)
        }
      } catch (err) {
        console.error('Unexpected error fetching user profile:', err)
        if (isMounted) {
          setProfile(null)
        }
      }
    }

    async function initSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error fetching user session:', error)
        }
        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Unexpected error initializing session:', err)
        if (isMounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initSession()

    // Suscribirse a cambios de estado de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return
        if (session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
        if (isMounted) {
          setLoading(false)
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
