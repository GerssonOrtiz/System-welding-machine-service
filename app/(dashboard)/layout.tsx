// app/(dashboard)/layout.tsx
// Server Component que valida la sesión en el servidor y alimenta UserProvider + DashboardShell.
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { UserProvider } from '@/hooks/useUser'
import { DashboardShell } from '@/components/layout/DashboardShell'
import type { UserProfile } from '@/types/user'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) {
    redirect('/login?error=no-aprobado')
  }

  return (
    <UserProvider initialUser={user} initialProfile={profile as unknown as UserProfile}>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  )
}
