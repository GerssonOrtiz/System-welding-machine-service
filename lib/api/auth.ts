// lib/api/auth.ts
// Helpers de autenticación y autorización para API Routes.
// Centraliza la lógica repetida de: verificar sesión → obtener perfil → comprobar permisos.
// Usa getUser() (validación server-side) en lugar de getSession() (solo local).

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type Supabase = SupabaseClient<Database>

export interface AuthProfile {
  id: string
  username: string
  role: string
  is_active: boolean
  is_superadmin: boolean
}

export interface AuthContext {
  supabase: Supabase
  userId: string
  profile: AuthProfile
}

type AuthError = NextResponse

/**
 * Verifica que el request tenga sesión activa y perfil válido.
 * Retorna `{ ok: true, ctx }` o `{ ok: false, error: NextResponse }`.
 *
 * Usa `getUser()` para validar el token contra Supabase Auth (seguro en servidor).
 */
export async function requireAuth(
  selectFields = 'username, role, is_active, is_superadmin'
): Promise<
  | { ok: true; ctx: AuthContext }
  | { ok: false; error: AuthError }
> {
  const supabase = await createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 }),
    }
  }

  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select(selectFields)
    .eq('id', user.id)
    .single()

  if (profileError || !profileData) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, error: 'Perfil de usuario no encontrado' }, { status: 404 }),
    }
  }

  const profile = profileData as unknown as AuthProfile

  if (!profile.is_active) {
    return {
      ok: false,
      error: NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 }),
    }
  }

  return {
    ok: true,
    ctx: { supabase, userId: user.id, profile },
  }
}

/**
 * Igual que requireAuth pero además exige que el usuario sea superadmin.
 * Retorna `{ ok: true, ctx }` o `{ ok: false, error: NextResponse }`.
 */
export async function requireSuperadmin(): Promise<
  | { ok: true; ctx: AuthContext }
  | { ok: false; error: AuthError }
> {
  const result = await requireAuth()
  if (!result.ok) return result

  const { profile } = result.ctx
  if (profile.role !== 'superadmin' || !profile.is_superadmin) {
    return {
      ok: false,
      error: NextResponse.json(
        { success: false, error: 'Acceso denegado. Solo el superadmin puede realizar esta acción' },
        { status: 403 }
      ),
    }
  }

  return result
}
