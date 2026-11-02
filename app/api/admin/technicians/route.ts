// app/api/admin/technicians/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api/auth'

/**
 * GET: Listar todos los técnicos (incluyendo inactivos para gestión)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperadmin()
    if (!authResult.ok) return authResult.error
    const { supabase } = authResult.ctx

    const { data: techs, error } = await supabase
      .from('technicians')
      .select('*')
      .order('name')

    if (error) throw error

    return NextResponse.json({ success: true, data: techs })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

/**
 * POST: Añadir un nuevo técnico
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperadmin()
    if (!authResult.ok) return authResult.error
    const { supabase } = authResult.ctx

    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Nombre inválido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('technicians')
      .insert({ name: name.trim().toUpperCase() })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ success: false, error: 'Ya existe un técnico con ese nombre' }, { status: 409 })
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
