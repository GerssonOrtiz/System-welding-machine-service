// app/api/stats/models/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import {
  computeModelDeepStats,
  computeModelSummaries,
  RawEquipmentRecord,
  RawStatusHistoryRecord
} from '@/lib/stats/model-forecast'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth('role, is_active')
    if (!authResult.ok) return authResult.error
    const { supabase } = authResult.ctx

    const { searchParams } = new URL(request.url)
    const brandFilter = searchParams.get('brand')?.trim().toUpperCase()
    const serviceTypeFilter = searchParams.get('service_type')?.trim()
    const modelParam = searchParams.get('model')?.trim().toUpperCase()

    // 1. Obtener equipos con tiempos
    let query = supabase
      .from('equipment_records')
      .select(`
        id,
        fr_number,
        brand,
        model,
        service_type,
        date_in,
        start_diagnosis_at,
        end_diagnosis_at,
        pending_approval_at,
        approval_at,
        start_maintenance_at,
        end_maintenance_at,
        finalized_at,
        current_status_id,
        workflow_states (
          id,
          name,
          is_terminal
        )
      `)

    if (brandFilter) {
      query = query.ilike('brand', brandFilter)
    }

    if (serviceTypeFilter) {
      query = query.eq('service_type', serviceTypeFilter as any)
    }

    if (modelParam) {
      query = query.ilike('model', modelParam)
    }

    const { data: records, error } = await query

    if (error) {
      console.error('[GET /api/stats/models] Database error:', error)
      return NextResponse.json({ success: false, error: 'Error al consultar equipos' }, { status: 500 })
    }

    const allRecords = (records || []) as unknown as RawEquipmentRecord[]

    // Si se solicitó un modelo específico (vía query param), retornar análisis profundo
    if (modelParam) {
      const modelRecords = allRecords.filter(r => (r.model || '').trim().toUpperCase() === modelParam)
      const equipmentIds = modelRecords.map(r => r.id)
      let historyData: RawStatusHistoryRecord[] = []

      if (equipmentIds.length > 0) {
        const { data: hist } = await supabase
          .from('status_history')
          .select('equipment_id, previous_status, new_status, changed_by_role, notes, is_override, override_reason, timestamp')
          .in('equipment_id', equipmentIds)
          .order('timestamp', { ascending: false })
          .limit(200)

        historyData = (hist || []) as unknown as RawStatusHistoryRecord[]
      }

      const deepData = computeModelDeepStats(
        modelParam,
        modelRecords[0]?.brand || brandFilter || 'S/M',
        modelRecords,
        historyData
      )

      return NextResponse.json({
        success: true,
        data: deepData
      })
    }

    // 2. Retornar ranking y resumen general de modelos
    const modelSummaries = computeModelSummaries(allRecords)

    return NextResponse.json({
      success: true,
      data: modelSummaries
    })

  } catch (err: any) {
    console.error('[GET /api/stats/models] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
