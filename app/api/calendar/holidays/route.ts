// app/api/calendar/holidays/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET: Obtener la lista de días no hábiles / feriados ordenados por fecha ascendente
 * Accesible para todos los usuarios autenticados (para la calculadora de entrega)
 */
export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('non_business_days')
      .select('id, holiday_date, reason, created_at')
      .order('holiday_date', { ascending: true })

    if (error) {
      // Si la tabla no ha sido creada aún en Supabase, responder amigablemente con array vacío
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error inesperado' }, { status: 500 })
  }
}

/**
 * POST: Registrar un nuevo día no hábil (solo superadmin)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si es superadmin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_superadmin, role')
      .eq('id', user.id)
      .single()

    if (!profile?.is_superadmin && profile?.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Solo el Superadministrador puede gestionar días no hábiles' }, { status: 403 })
    }

    const body = await request.json()
    const { holiday_date, reason } = body

    if (!holiday_date || !/^\d{4}-\d{2}-\d{2}$/.test(holiday_date)) {
      return NextResponse.json({ success: false, error: 'Fecha inválida. Use formato YYYY-MM-DD' }, { status: 400 })
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ success: false, error: 'Debe especificar el motivo o descripción del feriado' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('non_business_days')
      .insert({
        holiday_date,
        reason: reason.trim(),
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'Esta fecha ya está registrada como día no hábil' }, { status: 409 })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error inesperado' }, { status: 500 })
  }
}
