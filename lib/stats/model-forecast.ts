// lib/stats/model-forecast.ts
// Motor analítico y de pronóstico predictivo para modelos de equipos en SYNAPSE.

export interface ModelTimingMetric {
  avg_days: number
  median_days: number
  optimistic_days: number
  pessimistic_days: number
}

export interface WaitingPartsMetric {
  occurred_in_pct: number
  avg_days: number
  median_days: number
}

export interface ModelTimings {
  diagnosis: ModelTimingMetric
  approval: ModelTimingMetric
  waiting_parts: WaitingPartsMetric
  maintenance: ModelTimingMetric
  total_lead_time: {
    avg_days: number
    median_days: number
    best_case_days: number
    worst_case_days: number
  }
}

export interface DelayFactor {
  category: 'REPUESTOS_LOGISTICA' | 'COMPLEJIDAD_TECNICA' | 'CLIENTE_APROBACION' | 'CALIDAD_PRUEBAS' | 'OTRO'
  category_label: string
  role: string
  frequency: number
  impact: 'ALTO' | 'MEDIO' | 'LEVE'
  common_terms: string[]
  sample_notes: string[]
}

export interface FrequentService {
  service_type: string
  count: number
  avg_days: number
}

export interface ModelAuditDeepData {
  model_name: string
  brand: string
  sample_size: number
  confidence_level: 'ALTA' | 'MEDIA' | 'BAJA'
  timings: ModelTimings
  delay_factors: DelayFactor[]
  frequent_services: FrequentService[]
  recent_history?: Array<{
    role: string
    transition: string
    note: string
    is_override: boolean
    date: string
  }>
}

export interface ModelSummaryData {
  brand: string
  model: string
  total_services: number
  completed_services: number
  avg_total_days: number | null
  median_total_days: number | null
  delayed_rate: number // porcentaje > 5 días
}

// ─────────────────────────────────────────────────────────────────────────────
// Estadísticas numéricas básicas
// ─────────────────────────────────────────────────────────────────────────────

export function diffDays(startStr: string | null | undefined, endStr: string | null | undefined): number | null {
  if (!startStr || !endStr) return null
  const start = new Date(startStr).getTime()
  const end = new Date(endStr).getTime()
  if (isNaN(start) || isNaN(end) || end < start) return null
  return Math.round(((end - start) / (1000 * 60 * 60 * 24)) * 10) / 10
}

export function median(arr: number[]): number {
  if (!arr || arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const val = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  return Math.round(val * 10) / 10
}

export function average(arr: number[]): number {
  if (!arr || arr.length === 0) return 0
  const sum = arr.reduce((acc, val) => acc + val, 0)
  return Math.round((sum / arr.length) * 10) / 10
}

export function percentile(arr: number[], p: number): number {
  if (!arr || arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1)
  return Math.round(sorted[idx] * 10) / 10
}

// ─────────────────────────────────────────────────────────────────────────────
// Cálculo de días hábiles (excluyendo sábados y domingos)
// ─────────────────────────────────────────────────────────────────────────────

export function addBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate)
  let remaining = Math.round(businessDays)
  
  if (remaining <= 0) return result

  while (remaining > 0) {
    result.setDate(result.getDate() + 1)
    const dayOfWeek = result.getDay()
    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining--
    }
  }
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Clasificación de Text Mining / NLP simple para notas de status_history
// ─────────────────────────────────────────────────────────────────────────────

const DELAY_DICTIONARIES: Record<
  'REPUESTOS_LOGISTICA' | 'COMPLEJIDAD_TECNICA' | 'CLIENTE_APROBACION' | 'CALIDAD_PRUEBAS',
  { label: string; terms: string[]; defaultRole: string }
> = {
  REPUESTOS_LOGISTICA: {
    label: 'Logística y Repuestos',
    terms: [
      'STOCK', 'SIN STOCK', 'PROVEEDOR', 'LIMA', 'IMPORTACION', 'IMPORTACIÓN',
      'REPUESTO', 'TARJETA', 'IGBT', 'MODULO', 'MÓDULO', 'PEDIDO', 'EN ESPERA',
      'DESPACHO', 'COTIZAR REPUESTO', 'COMPATIBLE', 'TRANSISTOR', 'DIODO', 'POTENCIOMETRO'
    ],
    defaultRole: 'almacen'
  },
  COMPLEJIDAD_TECNICA: {
    label: 'Complejidad Técnica y Severidad',
    terms: [
      'SULFATADO', 'QUEMADO', 'CORTO', 'CORTOCIRCUITO', 'REBOBINADO', 'MINA',
      'POLVO', 'POLVO MINERAL', 'INTERMITENTE', 'HUMEDAD', 'REVISIÓN ADICIONAL',
      'REVISION ADICIONAL', 'PISTA VOLADA', 'DIAGNÓSTICO COMPLEJO', 'DIAGNOSTICO COMPLEJO',
      'DESGASTE SEVERO', 'BARNIZ', 'ULTRASONICA'
    ],
    defaultRole: 'operaciones'
  },
  CLIENTE_APROBACION: {
    label: 'Aprobación Comercial y Cliente',
    terms: [
      'CLIENTE', 'COTIZACION', 'COTIZACIÓN', 'APROBACION', 'APROBACIÓN', 'COSTO',
      'PRESUPUESTO', 'DECISION', 'DECISIÓN', 'SIN RESPUESTA', 'ESPERANDO CLIENTE',
      'ORDEN DE COMPRA', 'OC', 'CONFIRMACION', 'PENDIENTE CLIENTE'
    ],
    defaultRole: 'recepcion'
  },
  CALIDAD_PRUEBAS: {
    label: 'Control de Calidad y Pruebas',
    terms: [
      'PRUEBA', 'SOLDADURA', 'VOLTAJE', 'AMPERAJE', 'FALLA EN CARGA', 'CALIDAD',
      'DESCALIBRADO', 'REGULACIÓN', 'REGULACION', 'BANCO DE PRUEBAS', 'CICLO DE TRABAJO'
    ],
    defaultRole: 'operaciones'
  }
}

export function classifyDelayFactors(
  historyNotes: Array<{
    notes: string | null
    override_reason: string | null
    changed_by_role: string | null
    previous_status?: string | null
    new_status?: string | null
  }>
): DelayFactor[] {
  const categoryStats: Record<
    string,
    {
      roleCounts: Record<string, number>
      termCounts: Record<string, number>
      sampleNotes: string[]
      totalOccurrences: number
    }
  > = {
    REPUESTOS_LOGISTICA: { roleCounts: {}, termCounts: {}, sampleNotes: [], totalOccurrences: 0 },
    COMPLEJIDAD_TECNICA: { roleCounts: {}, termCounts: {}, sampleNotes: [], totalOccurrences: 0 },
    CLIENTE_APROBACION: { roleCounts: {}, termCounts: {}, sampleNotes: [], totalOccurrences: 0 },
    CALIDAD_PRUEBAS: { roleCounts: {}, termCounts: {}, sampleNotes: [], totalOccurrences: 0 },
  }

  historyNotes.forEach(item => {
    const rawText = `${item.notes || ''} ${item.override_reason || ''}`.trim()
    if (!rawText || rawText.length < 4) return

    const upperText = rawText.toUpperCase()
    const userRole = (item.changed_by_role || 'operaciones').toLowerCase()

    let matchedAny = false

    ;(Object.keys(DELAY_DICTIONARIES) as Array<keyof typeof DELAY_DICTIONARIES>).forEach(catKey => {
      const dict = DELAY_DICTIONARIES[catKey]
      const foundTerms = dict.terms.filter(term => upperText.includes(term))

      if (foundTerms.length > 0) {
        matchedAny = true
        const stats = categoryStats[catKey]
        stats.totalOccurrences++
        stats.roleCounts[userRole] = (stats.roleCounts[userRole] || 0) + 1

        foundTerms.forEach(t => {
          stats.termCounts[t] = (stats.termCounts[t] || 0) + 1
        })

        if (stats.sampleNotes.length < 3 && !stats.sampleNotes.includes(rawText)) {
          stats.sampleNotes.push(rawText)
        }
      }
    })

    // Si no hizo match pero hay nota en estado de repuesto o similar
    if (!matchedAny && (item.new_status?.toLowerCase().includes('repuesto') || item.previous_status?.toLowerCase().includes('repuesto'))) {
      const stats = categoryStats.REPUESTOS_LOGISTICA
      stats.totalOccurrences++
      stats.roleCounts[userRole] = (stats.roleCounts[userRole] || 0) + 1
      if (stats.sampleNotes.length < 3 && !stats.sampleNotes.includes(rawText)) {
        stats.sampleNotes.push(rawText)
      }
    }
  })

  // Convertir a array de DelayFactor ordenado por frecuencia
  const result: DelayFactor[] = []

  ;(Object.keys(DELAY_DICTIONARIES) as Array<keyof typeof DELAY_DICTIONARIES>).forEach(catKey => {
    const stats = categoryStats[catKey]
    if (stats.totalOccurrences === 0) return

    // Rol más frecuente
    const topRole = Object.entries(stats.roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || DELAY_DICTIONARIES[catKey].defaultRole

    // Términos más frecuentes
    const topTerms = Object.entries(stats.termCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t]) => t)

    const impact: 'ALTO' | 'MEDIO' | 'LEVE' =
      stats.totalOccurrences >= 5 ? 'ALTO' : stats.totalOccurrences >= 2 ? 'MEDIO' : 'LEVE'

    result.push({
      category: catKey,
      category_label: DELAY_DICTIONARIES[catKey].label,
      role: topRole,
      frequency: stats.totalOccurrences,
      impact,
      common_terms: topTerms.length > 0 ? topTerms : ['OBSERVACIÓN GENERAL'],
      sample_notes: stats.sampleNotes
    })
  })

  return result.sort((a, b) => b.frequency - a.frequency)
}

// ─────────────────────────────────────────────────────────────────────────────
// Procesamiento profundo de datos de un modelo
// ─────────────────────────────────────────────────────────────────────────────

export interface RawEquipmentRecord {
  id: string
  fr_number?: string | null
  brand: string | null
  model: string | null
  service_type: string | null
  date_in: string | null
  start_diagnosis_at?: string | null
  end_diagnosis_at?: string | null
  pending_approval_at?: string | null
  approval_at?: string | null
  start_maintenance_at?: string | null
  end_maintenance_at?: string | null
  finalized_at?: string | null
  current_status_id?: string | null
  workflow_states?: {
    id: string
    name: string
    is_terminal: boolean
  } | null
}

export interface RawStatusHistoryRecord {
  equipment_id: string
  previous_status: string | null
  new_status: string | null
  changed_by_role: string | null
  notes: string | null
  is_override: boolean | null
  override_reason: string | null
  timestamp: string
}

export function computeModelDeepStats(
  modelName: string,
  brandFallback: string,
  records: RawEquipmentRecord[],
  historyRecords: RawStatusHistoryRecord[]
): ModelAuditDeepData {
  const diagDays: number[] = []
  const apprDays: number[] = []
  const maintDays: number[] = []
  const totalDays: number[] = []

  // Calcular tiempos de espera de repuestos a partir del historial
  const equipmentWaitingDays: Record<string, number> = {}
  const equipmentIdsWithPartsWaiting = new Set<string>()

  // Agrupar historial por equipo ordenado cronológicamente
  const historyByEq: Record<string, RawStatusHistoryRecord[]> = {}
  historyRecords.forEach(h => {
    if (!historyByEq[h.equipment_id]) historyByEq[h.equipment_id] = []
    historyByEq[h.equipment_id].push(h)
  })

  Object.entries(historyByEq).forEach(([eqId, events]) => {
    // Ordenar de más antiguo a más reciente
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    let enterPartsWaitTime: number | null = null

    sorted.forEach(ev => {
      const isEnterWait = (ev.new_status || '').toLowerCase().includes('repuesto')
      const isExitWait = (ev.previous_status || '').toLowerCase().includes('repuesto') && !isEnterWait

      if (isEnterWait && enterPartsWaitTime === null) {
        enterPartsWaitTime = new Date(ev.timestamp).getTime()
        equipmentIdsWithPartsWaiting.add(eqId)
      } else if (isExitWait && enterPartsWaitTime !== null) {
        const exitTime = new Date(ev.timestamp).getTime()
        const days = Math.max(0, Math.round(((exitTime - enterPartsWaitTime) / (1000 * 60 * 60 * 24)) * 10) / 10)
        equipmentWaitingDays[eqId] = (equipmentWaitingDays[eqId] || 0) + days
        enterPartsWaitTime = null
      }
    })

    if (enterPartsWaitTime !== null) {
      // Sigue esperando o finalizó sin log de salida específico
      const exitTime = Date.now()
      const days = Math.max(0, Math.round(((exitTime - enterPartsWaitTime) / (1000 * 60 * 60 * 24)) * 10) / 10)
      equipmentWaitingDays[eqId] = (equipmentWaitingDays[eqId] || 0) + days
    }
  })

  const serviceTypeCounts: Record<string, { count: number; totalDays: number[] }> = {}

  records.forEach(r => {
    // Diagnóstico
    const diag = diffDays(r.start_diagnosis_at || r.date_in, r.end_diagnosis_at || r.pending_approval_at)
    if (diag !== null) diagDays.push(diag)

    // Aprobación
    const appr = diffDays(r.pending_approval_at, r.approval_at || r.start_maintenance_at)
    if (appr !== null) apprDays.push(appr)

    // Mantenimiento
    const maint = diffDays(r.start_maintenance_at, r.end_maintenance_at || r.finalized_at)
    if (maint !== null) maintDays.push(maint)

    // Total
    const tot = diffDays(r.date_in, r.finalized_at)
    if (tot !== null) totalDays.push(tot)

    // Frecuencia por tipo de servicio
    const st = r.service_type || 'REVISION_GENERAL'
    if (!serviceTypeCounts[st]) serviceTypeCounts[st] = { count: 0, totalDays: [] }
    serviceTypeCounts[st].count++
    if (tot !== null) serviceTypeCounts[st].totalDays.push(tot)
  })

  const sampleSize = records.length
  const confidenceLevel: 'ALTA' | 'MEDIA' | 'BAJA' =
    sampleSize >= 15 ? 'ALTA' : sampleSize >= 5 ? 'MEDIA' : 'BAJA'

  // Espera de repuestos
  const waitingPartsDaysArr = Object.values(equipmentWaitingDays)
  const occurredInPct = sampleSize > 0
    ? Math.round((equipmentIdsWithPartsWaiting.size / sampleSize) * 1000) / 10
    : 0

  const frequentServices: FrequentService[] = Object.entries(serviceTypeCounts).map(([st, data]) => ({
    service_type: st,
    count: data.count,
    avg_days: average(data.totalDays) || average(totalDays) || 7.0
  })).sort((a, b) => b.count - a.count)

  const delayFactors = classifyDelayFactors(historyRecords)

  const detectedBrand = records[0]?.brand || brandFallback || 'S/M'

  return {
    model_name: modelName,
    brand: detectedBrand,
    sample_size: sampleSize,
    confidence_level: confidenceLevel,
    timings: {
      diagnosis: {
        avg_days: average(diagDays) || 1.8,
        median_days: median(diagDays) || 1.5,
        optimistic_days: percentile(diagDays, 20) || 1.0,
        pessimistic_days: percentile(diagDays, 80) || 3.0,
      },
      approval: {
        avg_days: average(apprDays) || 2.2,
        median_days: median(apprDays) || 2.0,
        optimistic_days: percentile(apprDays, 20) || 1.0,
        pessimistic_days: percentile(apprDays, 80) || 4.0,
      },
      waiting_parts: {
        occurred_in_pct: occurredInPct,
        avg_days: average(waitingPartsDaysArr) || 4.0,
        median_days: median(waitingPartsDaysArr) || 3.5,
      },
      maintenance: {
        avg_days: average(maintDays) || 3.5,
        median_days: median(maintDays) || 3.0,
        optimistic_days: percentile(maintDays, 20) || 2.0,
        pessimistic_days: percentile(maintDays, 80) || 5.5,
      },
      total_lead_time: {
        avg_days: average(totalDays) || 8.5,
        median_days: median(totalDays) || 7.5,
        best_case_days: percentile(totalDays, 10) || 4.0,
        worst_case_days: percentile(totalDays, 90) || 15.0,
      }
    },
    delay_factors: delayFactors,
    frequent_services: frequentServices,
    recent_history: historyRecords.slice(0, 50).map(h => ({
      role: h.changed_by_role || 'operaciones',
      transition: `${h.previous_status || 'INICIO'} ➔ ${h.new_status}`,
      note: h.notes || h.override_reason || '',
      is_override: Boolean(h.is_override),
      date: h.timestamp
    }))
  }
}

export function computeModelSummaries(records: RawEquipmentRecord[]): ModelSummaryData[] {
  const modelMap = new Map<string, {
    brand: string
    model: string
    total: number
    completed: number
    totalDaysArr: number[]
    delayedCount: number
  }>()

  records.forEach(r => {
    const mName = (r.model || 'S/M').trim().toUpperCase()
    const bName = (r.brand || 'S/M').trim().toUpperCase()
    const key = `${bName}___${mName}`

    if (!modelMap.has(key)) {
      modelMap.set(key, {
        brand: bName,
        model: mName,
        total: 0,
        completed: 0,
        totalDaysArr: [],
        delayedCount: 0
      })
    }

    const item = modelMap.get(key)!
    item.total++

    const isDone = Boolean(r.workflow_states?.is_terminal || r.finalized_at)
    if (isDone) {
      item.completed++
    }

    const tot = diffDays(r.date_in, r.finalized_at)
    if (tot !== null) {
      item.totalDaysArr.push(tot)
      if (tot > 5) {
        item.delayedCount++
      }
    } else if (r.date_in) {
      // Si no ha finalizado, verificar días transcurridos hasta hoy
      const elapsed = diffDays(r.date_in, new Date().toISOString())
      if (elapsed !== null && elapsed > 5) {
        item.delayedCount++
      }
    }
  })

  return Array.from(modelMap.values()).map(m => {
    const avg = m.totalDaysArr.length > 0 ? average(m.totalDaysArr) : null
    const med = m.totalDaysArr.length > 0 ? median(m.totalDaysArr) : null
    const delayedRate = m.total > 0 ? Math.round((m.delayedCount / m.total) * 1000) / 10 : 0

    return {
      brand: m.brand,
      model: m.model,
      total_services: m.total,
      completed_services: m.completed,
      avg_total_days: avg,
      median_total_days: med,
      delayed_rate: delayedRate
    }
  }).sort((a, b) => b.total_services - a.total_services)
}


