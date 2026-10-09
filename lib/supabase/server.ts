// lib/supabase/server.ts
// Dos clientes para el servidor: normal (con RLS) y admin (bypass de RLS)
// NUNCA usar createAdminClient() sin verificar is_superadmin = true primero
import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// Cliente normal — respeta RLS con la sesión del usuario actual
// Usar en: Server Components, API Routes normales
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSSRServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignorado en Server Components donde no se permite mutar cookies.
            // El refresco es gestionado por Proxy / Middleware.
          }
        },
      },
    }
  )
}

// Cliente admin — bypass total de RLS (usa service_role_key)
// SOLO para operaciones de superadmin en API Routes
// SIEMPRE verificar is_superadmin = true ANTES de usar este cliente
export function createAdminClient() {
  return createSSRServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
