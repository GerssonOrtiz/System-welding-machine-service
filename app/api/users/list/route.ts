// app/api/users/list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar sesión y que el usuario sea superadmin activo
    const authResult = await requireSuperadmin()
    if (!authResult.ok) return authResult.error
    const { profile } = authResult.ctx

    // 3. Obtener clientes admin para ver auth.users (service_role)
    const adminSupabase = createAdminClient()
    const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers()

    if (authError) {
      console.error('[GET /api/users/list] Auth list error:', authError)
      return NextResponse.json({ success: false, error: 'Error al consultar usuarios del sistema de autenticación' }, { status: 500 })
    }

    // 4. Obtener todos los perfiles de la base de datos
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('user_profiles')
      .select('*')

    if (profilesError) {
      console.error('[GET /api/users/list] Profiles fetch error:', profilesError)
      return NextResponse.json({ success: false, error: 'Error al consultar perfiles de la base de datos' }, { status: 500 })
    }

    // 5. Mapear y unir
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    const data = authData.users.map((authUser) => {
      const dbProfile = profileMap.get(authUser.id) || {} as any
      return {
        id: authUser.id,
        username: dbProfile.username || 'SIN_PERFIL',
        full_name: dbProfile.full_name || authUser.user_metadata?.full_name || null,
        email: authUser.email || 'sin_email@cabelab.com',
        role: dbProfile.role || 'pendiente',
        is_active: !!dbProfile.is_active,
        is_superadmin: !!dbProfile.is_superadmin,
        created_at: dbProfile.created_at || authUser.created_at,
      }
    })

    return NextResponse.json({
      success: true,
      data
    })

  } catch (err) {
    console.error('[GET /api/users/list] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
