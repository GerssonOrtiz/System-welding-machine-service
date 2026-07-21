// app/api/stats/route.ts
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

    // 2. Obtener perfil del usuario
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', session.user.id)
      .single()

    const activeProfile = userProfile as any
    if (!activeProfile || !activeProfile.is_active) {
      return NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 })
    }

    // 3. Validar roles permitidos
    const allowedRoles = ['superadmin', 'admin', 'visualizador']
    if (!allowedRoles.includes(activeProfile.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    // 4. Obtener equipos (TODOS) de la vista para estadísticas globales
    const { data: allEquips, error: allErr } = await supabase
      .from('equipment_with_status')
      .select('id, fr_number, client_name, status_name, status_color, service_type, days_elapsed, brand, model, assigned_technicians, is_terminal, date_in')

    if (allErr) {
      console.error('[GET /api/stats] Database error:', allErr)
      return NextResponse.json({ success: false, error: 'Error al consultar datos globales' }, { status: 500 })
    }

    const equipmentList = (allEquips || []) as any[]
    const total_registered = equipmentList.length
    
    // Equipos actualmente activos (no terminales)
    const activeList = equipmentList.filter(e => !e.is_terminal)
    const total_active = activeList.length

    // Filtrar equipos con days_elapsed > 5 (solo activos)
    const delayedList = activeList.filter((e: any) => e.days_elapsed > 5)
    const total_delayed = delayedList.length

    const delayed_equipment = delayedList.map((e: any) => ({
      fr_number: e.fr_number,
      client_name: e.client_name,
      status_name: e.status_name,
      days_elapsed: e.days_elapsed
    }))

    // Agrupar por estado (Global)
    const statusCounts: Record<string, { count: number; color: string }> = {}
    for (const e of equipmentList) {
      if (!statusCounts[e.status_name]) {
        statusCounts[e.status_name] = { count: 0, color: e.status_color || '#6B7280' }
      }
      statusCounts[e.status_name].count++
    }
    const by_status = Object.entries(statusCounts).map(([name, val]) => ({
      status_name: name,
      count: val.count,
      color: val.color
    }))

    // Agrupar por tipo de servicio (Global)
    const serviceCounts: Record<string, number> = {}
    for (const e of equipmentList) {
      serviceCounts[e.service_type] = (serviceCounts[e.service_type] || 0) + 1
    }
    const by_service_type = Object.entries(serviceCounts).map(([type, count]) => ({
      service_type: type,
      count
    }))

    // Agrupar por Marca (Global)
    const brandCounts: Record<string, number> = {}
    for (const e of equipmentList) {
      const brand = e.brand || 'SIN MARCA'
      brandCounts[brand] = (brandCounts[brand] || 0) + 1
    }
    const by_brand = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Agrupar por Técnico (Carga actual de trabajo - Solo Activos)
    const techCounts: Record<string, number> = {}
    for (const e of activeList) {
      if (e.assigned_technicians && Array.isArray(e.assigned_technicians)) {
        for (const tech of e.assigned_technicians) {
          techCounts[tech] = (techCounts[tech] || 0) + 1
        }
      }
    }
    const by_technician = Object.entries(techCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // 4b. Agrupar por Empresa (Cliente) con detalles de Marcas, Modelos y Entradas Recientes
    const companyStats: Record<string, { 
      name: string; 
      total: number; 
      by_status: Record<string, number>;
      by_brand: Record<string, number>;
      top_models: Record<string, number>;
      recent_equipment: Array<{ brand: string; model: string; date_in: string; fr_number: string }>;
    }> = {}

    // Primero ordenamos por fecha para obtener los más recientes
    const sortedEquips = [...equipmentList].sort((a, b) => 
      new Date(b.date_in).getTime() - new Date(a.date_in).getTime()
    )

    for (const e of sortedEquips) {
      const company = e.client_name || 'DESCONOCIDO'
      const brand = e.brand || 'S/M'
      const model = e.model || ''
      const isModelGeneric = !model || ['N/A', 'SIN MODELO', '.', '-', 'S/M', 'S/N'].includes(model.toUpperCase())

      if (!companyStats[company]) {
        companyStats[company] = { 
          name: company, 
          total: 0, 
          by_status: {}, 
          by_brand: {},
          top_models: {},
          recent_equipment: []
        }
      }
      companyStats[company].total++
      
      // Conteo por estado
      companyStats[company].by_status[e.status_name] = (companyStats[company].by_status[e.status_name] || 0) + 1
      
      // Conteo por marca
      companyStats[company].by_brand[brand] = (companyStats[company].by_brand[brand] || 0) + 1
      
      // Conteo por modelo (Solo si no es genérico)
      if (!isModelGeneric) {
        companyStats[company].top_models[model] = (companyStats[company].top_models[model] || 0) + 1
      }

      // Agregar a recientes (máximo 10)
      if (companyStats[company].recent_equipment.length < 10) {
        companyStats[company].recent_equipment.push({
          brand,
          model: model || 'SIN MODELO',
          date_in: e.date_in,
          fr_number: e.fr_number
        })
      }
    }

    const by_company = Object.values(companyStats)
      .sort((a, b) => b.total - a.total)
      .map(c => ({
        ...c,
        by_status: Object.entries(c.by_status).map(([status, count]) => ({ status, count })),
        by_brand: Object.entries(c.by_brand)
          .map(([brand, count]) => ({ brand, count }))
          .sort((a, b) => b.count - a.count),
        top_models: Object.entries(c.top_models)
          .map(([model, count]) => ({ model, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      }))

    // 5. Equipos entregados este mes
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count: deliveredCount, error: delError } = await supabase
      .from('status_history')
      .select('*', { count: 'exact', head: true })
      .eq('new_status', 'Entregado')
      .gte('timestamp', firstDayOfMonth)

    const delivered_this_month = deliveredCount || 0

    // 6. Promedio de días para entrega (últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: historyLogs, error: histErr } = await supabase
      .from('status_history')
      .select('equipment_id, timestamp')
      .eq('new_status', 'Entregado')
      .gte('timestamp', thirtyDaysAgo)

    let avg_days_to_delivery = 0

    if (historyLogs && historyLogs.length > 0) {
      const historyLogsList = historyLogs as any[]
      const eqIds = historyLogsList.map((h: any) => h.equipment_id)
      const { data: equips } = await supabase
        .from('equipment_records')
        .select('id, date_in')
        .in('id', eqIds)

      if (equips) {
        const equipMap = new Map(equips.map((e: any) => [e.id, new Date(e.date_in).getTime()]))
        let totalDays = 0
        let countDelivered = 0

        for (const log of historyLogsList) {
          const dateInTime = equipMap.get(log.equipment_id)
          if (dateInTime) {
            const deliveryTime = new Date(log.timestamp).getTime()
            const diffDays = (deliveryTime - dateInTime) / (1000 * 60 * 60 * 24)
            totalDays += diffDays
            countDelivered++
          }
        }
        avg_days_to_delivery = countDelivered > 0 ? Math.round((totalDays / countDelivered) * 10) / 10 : 0
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total_registered,
        total_active,
        total_delayed,
        delivered_this_month,
        avg_days_to_delivery,
        by_status,
        by_service_type,
        by_brand,
        by_technician,
        by_company,
        delayed_equipment
      }
    })

  } catch (err) {
    console.error('[GET /api/stats] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
