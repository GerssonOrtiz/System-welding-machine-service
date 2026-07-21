// app/api/equipment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { canViewAllEquipment } from '@/types/user'

const CAN_VIEW_ALL = ['superadmin', 'admin', 'visualizador']

const ROLE_RELEVANT_STATES: Record<string, string[]> = {
  operaciones: [
    'En espera de diagnóstico',
    'En diagnóstico',
    'En espera de repuesto',
    'Aprobado',
    'En mantenimiento',
    'En espera de repuesto adicional',
  ],
  recepcion: [
    'En espera de diagnóstico',
    'Pendiente de aprobación',
    'Aprobado',
    'Entregado',
  ],
  almacen: [
    'En espera de repuesto',
    'En espera de repuesto adicional',
  ],
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Obtener perfil del usuario
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, is_active, is_superadmin')
      .eq('id', session.user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ success: false, error: 'Perfil de usuario no encontrado' }, { status: 404 })
    }

    const activeProfile = userProfile as any

    if (!activeProfile.is_active) {
      return NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 })
    }

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
    const hasViewAll = CAN_VIEW_ALL.includes(activeProfile.role)
    if (!hasViewAll) {
      const relevantStates = ROLE_RELEVANT_STATES[activeProfile.role] || []
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
    const supabase = await createServerClient()

    // 1. Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Obtener perfil
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, is_active, is_superadmin')
      .eq('id', session.user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ success: false, error: 'Perfil de usuario no encontrado' }, { status: 404 })
    }

    const activeProfile = userProfile as any

    if (!activeProfile.is_active) {
      return NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 })
    }

    // 3. Verificar que sea superadmin
    if (activeProfile.role !== 'superadmin' || !activeProfile.is_superadmin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado. Solo el superadmin puede eliminar todos los equipos' }, { status: 403 })
    }

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
