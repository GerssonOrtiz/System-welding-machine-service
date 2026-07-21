// app/api/equipment/serial/[serial]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  try {
    const { serial } = await params
    const cleanSerial = serial.trim().toUpperCase()

    // 1. Validar que no sea un valor genérico de "sin serie"
    const genericValues = ['N/S', 'S/N', 'N/A', 'SIN SERIE', 'SIN N/S', '-', '.', '', 'UNDEFINED', 'NULL']
    if (genericValues.includes(cleanSerial)) {
      return NextResponse.json({ 
        success: true, 
        data: { 
          found: false, 
          serial: cleanSerial,
          interventions: [],
          message: 'El valor ingresado es genérico y no identifica a una máquina única.'
        } 
      })
    }

    const supabase = await createServerClient()

    // 1. Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Buscar todos los registros con ese número de serie
    // Usamos ILIKE para que no importe mayúsculas/minúsculas y trim para evitar espacios
    const { data: rawInterventions, error: intError } = await supabase
      .from('equipment_with_status')
      .select('*')
      .ilike('serial_number', serial.trim())
      .order('date_in', { ascending: false })

    if (intError) {
      console.error('[GET /api/equipment/serial/[serial]] Error:', intError)
      return NextResponse.json({ success: false, error: 'Error al buscar historial por serie' }, { status: 500 })
    }

    const interventions = (rawInterventions || []) as any[]

    if (interventions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: { 
          found: false, 
          serial,
          interventions: [] 
        } 
      })
    }

    // 3. Obtener metadatos consolidados (asumiendo que son la misma máquina)
    const machineInfo = {
      serial_number: interventions[0].serial_number,
      brand: interventions[0].brand,
      model: interventions[0].model,
      total_interventions: interventions.length,
      last_service: interventions[0].date_in,
      clients: Array.from(new Set(interventions.map(i => i.client_name))),
    }

    return NextResponse.json({
      success: true,
      data: {
        found: true,
        machineInfo,
        interventions
      }
    })

  } catch (err: any) {
    console.error('[GET /api/equipment/serial/[serial]] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
