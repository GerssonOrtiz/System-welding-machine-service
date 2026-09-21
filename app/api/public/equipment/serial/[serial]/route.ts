// app/api/public/equipment/serial/[serial]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Endpoint público para consulta de documentación e historial de informes por número de serie
// No expone información confidencial (técnicos, usuarios internos, precios), solo metadatos e informes.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  try {
    const { serial } = await params
    const cleanSerial = decodeURIComponent(serial).trim().toUpperCase()

    // 1. Validar que no sea un valor genérico
    const genericValues = ['N/S', 'S/N', 'N/A', 'SIN SERIE', 'SIN N/S', '-', '.', '', 'UNDEFINED', 'NULL']
    if (genericValues.includes(cleanSerial)) {
      return NextResponse.json({
        success: true,
        data: {
          found: false,
          serial: cleanSerial,
          interventions: [],
          message: 'El número de serie es genérico o no válido.',
        },
      })
    }

    // Usar admin client para bypass de RLS en consulta pública de lectura
    const supabase = createAdminClient()

    // 2. Buscar intervenciones por número de serie
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
        service_type,
        current_status_id,
        workflow_states (
          name,
          color
        )
      `)
      .ilike('serial_number', cleanSerial)
      .order('date_in', { ascending: false })

    if (error) {
      console.error('[GET /api/public/equipment/serial] Supabase error:', error)
      return NextResponse.json({ success: false, error: 'Error al consultar documentación' }, { status: 500 })
    }

    const records = (rawData || []) as any[]

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          found: false,
          serial: cleanSerial,
          interventions: [],
        },
      })
    }

    // Formatear intervenciones para consumo público
    const interventions = records.map((rec) => ({
      id: rec.id,
      fr_number: rec.fr_number,
      date_in: rec.date_in,
      report_number: rec.report_number,
      report_url: rec.report_url,
      service_type: rec.service_type,
      status_name: rec.workflow_states?.name || 'En proceso',
      status_color: rec.workflow_states?.color || '#00E5FF',
    }))

    // Buscar el informe más reciente disponible que tenga report_url
    const latestReportWithUrl = interventions.find((i) => Boolean(i.report_url)) || null

    const machineInfo = {
      serial_number: records[0].serial_number,
      brand: records[0].brand,
      model: records[0].model,
      client_name: records[0].client_name,
      total_interventions: records.length,
      latest_report_url: latestReportWithUrl ? latestReportWithUrl.report_url : null,
      latest_report_number: latestReportWithUrl ? latestReportWithUrl.report_number : null,
      last_service: records[0].date_in,
    }

    return NextResponse.json({
      success: true,
      data: {
        found: true,
        machineInfo,
        interventions,
      },
    })
  } catch (err: any) {
    console.error('[GET /api/public/equipment/serial] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
