import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.ok) return authResult.error
    const { supabase } = authResult.ctx

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
