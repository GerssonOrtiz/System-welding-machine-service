import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth('is_active')
    if (!authResult.ok) return authResult.error
    const { supabase } = authResult.ctx

    // 3. Obtener técnicos de la nueva tabla de personal
    const { data: techs, error } = await supabase
      .from('technicians')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('[GET /api/users/technicians] Database error:', error)
      return NextResponse.json({ success: false, error: 'Error al obtener técnicos' }, { status: 500 })
    }

    const activeTechs = (techs || []) as Array<{ id: number; name: string }>

    // Mapear para compatibilidad con el frontend (username -> name)
    const formattedTechs = activeTechs.map(t => ({
      id: t.id.toString(),
      username: t.name
    }))

    return NextResponse.json({
      success: true,
      data: formattedTechs
    })

  } catch (err) {
    console.error('[GET /api/users/technicians] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
