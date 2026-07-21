// app/api/equipment/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Verificar sesión
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Verificar que el rol sea superadmin, admin o visualizador
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active, is_superadmin')
      .eq('id', user.id)
      .single() as any

    if (!profile?.is_active) {
      return NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 })
    }

    const allowedRoles = ['superadmin', 'admin', 'visualizador']
    if (!allowedRoles.includes(profile.role || '')) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 })
    }

    const format = request.nextUrl.searchParams.get('format') || 'xlsx'

    // 3. Obtener todos los equipos con información unida
    const { data: equipments, error } = await supabase
      .from('equipment_with_status')
      .select('*')
      .order('date_in', { ascending: false })

    if (error) {
      console.error('[GET /api/equipment/export] Database fetch error:', error)
      return NextResponse.json({ success: false, error: 'Error al obtener equipos de la base de datos' }, { status: 500 })
    }

    // Mapear los datos a la estructura exacta de exportación requerida
    const formattedData = (equipments || []).map((eq: any) => ({
      'FR': eq.fr_number || '',
      'N° Informe': eq.report_number || '',
      'Cliente': eq.client_name || '',
      'Tipo Servicio': eq.service_type || '',
      'Marca': eq.brand || '',
      'Modelo': eq.model || '',
      'N° Serie': eq.serial_number || '',
      'Estado Actual': eq.status_name || '',
      'Técnico Diagnóstico': eq.diagnosis_tech_username || '',
      'Técnico Mantenimiento': eq.maintenance_tech_username || '',
      'Reporte Cliente': eq.client_report || '',
      'Accesorios': eq.accessories || '',
      'Condición Ingreso': eq.condition_in || '',
      'Observaciones': eq.additional_observations || '',
      'Fecha Ingreso': eq.date_in ? new Date(eq.date_in).toLocaleString('es-PE') : '',
      'Inicio Diagnóstico': eq.start_diagnosis_at ? new Date(eq.start_diagnosis_at).toLocaleString('es-PE') : '',
      'Fin Diagnóstico': eq.end_diagnosis_at ? new Date(eq.end_diagnosis_at).toLocaleString('es-PE') : '',
      'Aprobación': eq.approval_at ? new Date(eq.approval_at).toLocaleString('es-PE') : '',
      'Inicio Mantenimiento': eq.start_maintenance_at ? new Date(eq.start_maintenance_at).toLocaleString('es-PE') : '',
      'Fin Mantenimiento': eq.end_maintenance_at ? new Date(eq.end_maintenance_at).toLocaleString('es-PE') : '',
      'Días Transcurridos': eq.days_elapsed || 0,
    }))

    const dateStr = new Date().toISOString().split('T')[0]

    // 4. Generar archivo Excel o CSV
    if (format === 'csv') {
      const worksheet = XLSX.utils.json_to_sheet(formattedData)
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet)
      
      // UTF-8 BOM prefix to prevent Excel representation problems with accents
      const bom = '\uFEFF'
      const response = new NextResponse(bom + csvOutput, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="cabelab-equipos-${dateStr}.csv"`,
        },
      })
      return response
    } else {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(formattedData)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipos')
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      const response = new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="cabelab-equipos-${dateStr}.xlsx"`,
        },
      })
      return response
    }
  } catch (err) {
    console.error('[GET /api/equipment/export] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno al exportar los datos' }, { status: 500 })
  }
}
