// app/api/equipment/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Verificar cuenta activa
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('is_active')
      .eq('id', session.user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ success: false, error: 'Perfil de usuario no encontrado' }, { status: 404 })
    }

    const activeProfile = userProfile as any

    if (!activeProfile.is_active) {
      return NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 })
    }

    // 3. Obtener query y normalizar
    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('q') || ''
    const includeDelivered = searchParams.get('include_delivered') === 'true'
    const searchQuery = rawQuery.trim().toUpperCase()

    if (searchQuery.length < 2) {
      return NextResponse.json(
        { success: false, error: 'El término de búsqueda debe tener al menos 2 caracteres' },
        { status: 400 }
      )
    }

    // 4. Buscar coincidencias en la vista usando ilike sobre campos clave
    let query = supabase
      .from('equipment_with_status')
      .select('*')
      .or(
        `fr_number.ilike.%${searchQuery}%,` +
        `client_name.ilike.%${searchQuery}%,` +
        `brand.ilike.%${searchQuery}%,` +
        `model.ilike.%${searchQuery}%,` +
        `serial_number.ilike.%${searchQuery}%,` +
        `status_name.ilike.%${searchQuery}%`
      )

    // Si no se pide incluir entregados, filtrar por is_terminal
    if (!includeDelivered) {
      query = query.eq('is_terminal', false)
    }

    const { data: results, error } = await query
      .order('date_in', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[GET /api/equipment/search] Query error:', error)
      return NextResponse.json(
        { success: false, error: 'Error al procesar la búsqueda en la base de datos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        results: results || [],
        total: results?.length || 0,
      }
    })

  } catch (err) {
    console.error('[GET /api/equipment/search] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
