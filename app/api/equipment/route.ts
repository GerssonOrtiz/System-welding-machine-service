// app/api/equipment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireSuperadmin } from '@/lib/api/auth'
import { canViewAllEquipment } from '@/types/user'
import { ROLE_RELEVANT_STATES } from '@/types/equipment'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.ok) return authResult.error
    const { supabase, profile } = authResult.ctx

    // 3. Leer query params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0', 10)
    const includeDelivered = searchParams.get('include_delivered') === 'true'
    const statusFilter = searchParams.get('status')
    const serviceFilter = searchParams.get('service_type')
    const pageSize = 20

    // 4. Construir consulta sobre la vista equipment_with_status
    let query = supabase
      .from('equipment_with_status')
      .select('*', { count: 'exact' })

    // Filtrar por estados del rol si no tiene permiso general para ver todo
    const hasViewAll = canViewAllEquipment(profile.role as any)
    if (!hasViewAll) {
      const relevantStates = ROLE_RELEVANT_STATES[profile.role] || []
      query = query.in('status_name', relevantStates)
    }

    // Filtrar equipos entregados (terminales) si no se solicita incluirlos
    if (!includeDelivered) {
      query = query.eq('is_terminal', false)
    }

    // Filtros dinámicos (Server-side)
    if (statusFilter) {
      query = query.eq('status_name', statusFilter)
    }
    if (serviceFilter) {
      query = query.eq('service_type', serviceFilter as any)
    }

    // Paginación
    const from = page * pageSize
    const to = from + pageSize - 1
    
    // 5. Ordenamiento: Por fecha de ingreso, los más recientes primero (Requerimiento de sección Equipos)
    query = query.order('date_in', { ascending: false })

    const { data: equipments, count, error } = await query
      .range(from, to)

    if (error) {
      console.error('[GET /api/equipment] Database error:', error)
      return NextResponse.json({ success: false, error: 'Error al consultar equipos de la base de datos' }, { status: 500 })
    }

    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      success: true,
      data: {
        equipments: equipments || [],
        total,
        page,
        page_size: pageSize,
        total_pages: totalPages,
      }
    })

  } catch (err) {
    console.error('[GET /api/equipment] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireSuperadmin()
    if (!authResult.ok) return authResult.error
    const { supabase } = authResult.ctx

    // 4. Eliminar todos los registros de la tabla
    const { error: deleteError } = await supabase
      .from('equipment_records')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      console.error('[DELETE /api/equipment] Error deleting all equipment:', deleteError)
      return NextResponse.json({ success: false, error: 'Error al eliminar todos los equipos: ' + deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[DELETE /api/equipment] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor: ' + (err?.message || '') }, { status: 500 })
  }
}
