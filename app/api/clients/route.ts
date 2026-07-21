import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Verificar sesión (opcional dependiendo de si el form es público, pero por seguridad lo dejamos)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Obtener nombres únicos de clientes desde equipment_records
    const { data, error } = await supabase
      .from('equipment_records')
      .select('client_name')
      .order('client_name', { ascending: true })

    if (error) {
      console.error('[GET /api/clients] Database error:', error)
      return NextResponse.json({ success: false, error: 'Error al obtener clientes' }, { status: 500 })
    }

    // Extraer nombres únicos y limpiar
    const clientNames = Array.from(new Set(data.map(item => item.client_name)))
      .filter(name => !!name)
      .sort((a, b) => a.localeCompare(b))

    return NextResponse.json({
      success: true,
      data: clientNames
    })

  } catch (err) {
    console.error('[GET /api/clients] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
