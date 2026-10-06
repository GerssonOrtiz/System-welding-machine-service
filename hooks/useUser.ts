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
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (isMounted) {
          setProfile(profileData)
        }
      } catch (err) {
        console.error('Error fetching user profile:', err)
      }
    }

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return

        if (session) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Error fetching user session:', err)
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
        if (session) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
          if (isMounted) setLoading(false)
        } else {
          setUser(null)
          setProfile(null)
          if (isMounted) setLoading(false)
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
