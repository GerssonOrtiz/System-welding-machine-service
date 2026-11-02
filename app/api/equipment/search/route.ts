import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth('is_active')
    if (!authResult.ok) return authResult.error
    const { supabase } = authResult.ctx

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

    // Sanitizar caracteres reservados de PostgREST para prevenir inyección de filtros
    const sanitizedQuery = searchQuery.replace(/[(),.*%\\]/g, '')

    if (sanitizedQuery.length < 2) {
      return NextResponse.json(
        { success: false, error: 'El término de búsqueda contiene demasiados caracteres especiales' },
        { status: 400 }
      )
    }

    // 4. Buscar coincidencias en la vista usando ilike sobre campos clave
    let query = supabase
      .from('equipment_with_status')
      .select('*')
      .or(
        `fr_number.ilike.%${sanitizedQuery}%,` +
        `client_name.ilike.%${sanitizedQuery}%,` +
        `brand.ilike.%${sanitizedQuery}%,` +
        `model.ilike.%${sanitizedQuery}%,` +
        `serial_number.ilike.%${sanitizedQuery}%,` +
        `status_name.ilike.%${sanitizedQuery}%`
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
