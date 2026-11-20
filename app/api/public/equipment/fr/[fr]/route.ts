// app/api/public/equipment/fr/[fr]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Endpoint público para consulta de un ingreso de equipo por número de ficha (FR).
// Usado por equipos sin número de serie — el QR apunta a esta ruta.
// No expone información confidencial (técnicos internos, precios).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fr: string }> }
) {
  try {
    const { fr } = await params
    const cleanFr = decodeURIComponent(fr).trim().toUpperCase()

    if (!cleanFr || cleanFr === 'UNDEFINED' || cleanFr === 'NULL') {
      return NextResponse.json({
        success: false,
        error: 'Número de ficha no válido.',
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: rawData, error } = await supabase
      .from('equipment_records')
      .select(`
        id,
        fr_number,
        serial_number,
        brand,
        model,
        client_name,
        date_in,
        report_number,
        report_url,
        service_report_url,
        vrd_certificate_url,
        service_type,
        quote_status,
        current_status_id,
        workflow_states (
          name,
          color,
          is_terminal
        )
      `)
      .ilike('fr_number', cleanFr)
      .single()

    if (error || !rawData) {
      return NextResponse.json({
        success: true,
        data: { found: false, fr: cleanFr },
      })
    }

    const rec = rawData as any
    const statusName = (rec.workflow_states?.name || '').trim()
    const statusNameLower = statusName.toLowerCase()
    const isTerminal = rec.workflow_states?.is_terminal === true || statusNameLower === 'entregado'
    const isPendingApproval = statusNameLower === 'pendiente de aprobación' || statusNameLower === 'pendiente de aprobacion'

    // Regla 1: Informe diagnóstico / final
    const canShowDiagnostic = isPendingApproval ? rec.quote_status === 'COTIZACION_LISTA' : true
    const visibleReportUrl = canShowDiagnostic ? (rec.report_url || null) : null

    // Regla 2: Informes de salida (servicio) y VRD solo cuando esté entregado
    const visibleServiceReportUrl = isTerminal ? (rec.service_report_url || null) : null
    const visibleVrdUrl = isTerminal ? (rec.vrd_certificate_url || null) : null

    return NextResponse.json(
      {
        success: true,
        data: {
          found: true,
          entry: {
            id: rec.id,
            fr_number: rec.fr_number,
            serial_number: rec.serial_number,
            brand: rec.brand,
            model: rec.model,
            client_name: rec.client_name,
            date_in: rec.date_in,
            report_number: rec.report_number,
            report_url: visibleReportUrl,
            service_report_url: visibleServiceReportUrl,
            vrd_certificate_url: visibleVrdUrl,
            service_type: rec.service_type,
            quote_status: rec.quote_status || 'PENDIENTE',
            status_name: statusName || 'En proceso',
            status_color: rec.workflow_states?.color || '#00E5FF',
            is_terminal: isTerminal,
          },
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (err: any) {
    console.error('[GET /api/public/equipment/fr] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
