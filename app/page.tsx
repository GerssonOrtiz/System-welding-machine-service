// app/page.tsx
// Redirección inteligente en la raíz (/) según estado de sesión y rol
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ROLE_HOME_ROUTE } from '@/types/user'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) {
    redirect('/login?error=no-aprobado')
  }

  const destination = ROLE_HOME_ROUTE[profile.role as keyof typeof ROLE_HOME_ROUTE] || '/login'
  redirect(destination)
}
