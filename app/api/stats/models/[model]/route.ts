// app/api/stats/models/[model]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'
import {
  computeModelDeepStats,
  RawEquipmentRecord,
  RawStatusHistoryRecord
} from '@/lib/stats/model-forecast'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ model: string }> }
) {
  try {
    const authResult = await requireAuth('role, is_active')
    if (!authResult.ok) return authResult.error
    const { supabase } = authResult.ctx

    const { model } = await params
    const cleanModel = decodeURIComponent(model).trim().toUpperCase()

    if (!cleanModel) {
      return NextResponse.json(
        { success: false, error: 'Modelo no especificado' },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const brandFilter = searchParams.get('brand')?.trim().toUpperCase()
    const serviceTypeFilter = searchParams.get('service_type')?.trim()

    // 1. Obtener equipos del modelo específico
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
      .ilike('model', cleanModel)

    if (brandFilter) {
      query = query.ilike('brand', brandFilter)
    }

    if (serviceTypeFilter) {
      query = query.eq('service_type', serviceTypeFilter as any)
    }

    const { data: records, error } = await query

    if (error) {
      console.error('[GET /api/stats/models/[model]] Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Error al consultar equipos del modelo' },
        { status: 500 }
      )
    }

    const modelRecords = (records || []) as unknown as RawEquipmentRecord[]

    // 2. Obtener historial y notas de demora para este modelo
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

    // 3. Procesar estadísticas profundas
    const deepData = computeModelDeepStats(
      cleanModel,
      modelRecords[0]?.brand || brandFilter || 'S/M',
      modelRecords,
      historyData
    )

    return NextResponse.json({
      success: true,
      data: deepData
    })

  } catch (err: any) {
    console.error('[GET /api/stats/models/[model]] Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
