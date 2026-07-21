// app/api/workflow/states/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Middleware check helper
async function checkAuth(supabase: any, requireSuperadmin: boolean = false) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { success: false, error: 'No autorizado', status: 401 } as const
  }

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role, is_active, is_superadmin')
    .eq('id', session.user.id)
    .single()

  const activeProfile = userProfile as any
  if (!activeProfile || !activeProfile.is_active) {
    return { success: false, error: 'Cuenta no activa', status: 403 } as const
  }

  if (requireSuperadmin && (activeProfile.role !== 'superadmin' || !activeProfile.is_superadmin)) {
    return { success: false, error: 'Acceso denegado. Solo el superadmin puede realizar esta acción', status: 403 } as const
  }

  return { success: true, profile: activeProfile, session } as const
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    const check = await checkAuth(supabase)
    if (!check.success) {
      return NextResponse.json({ success: false, error: check.error }, { status: check.status })
    }

    const { data: states, error } = await supabase
      .from('workflow_states')
      .select('*')
      .order('order_index', { ascending: true })

    if (error) {
      console.error('[GET /api/workflow/states] Database error:', error)
      return NextResponse.json({ success: false, error: 'Error al obtener los estados de la base de datos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: states || []
    })

  } catch (err) {
    console.error('[GET /api/workflow/states] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const check = await checkAuth(supabase, true)
    if (!check.success) {
      return NextResponse.json({ success: false, error: check.error }, { status: check.status })
    }

    const body = await request.json()
    const { name, order_index, color, is_initial, is_terminal } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'El nombre del estado es requerido' }, { status: 400 })
    }

    if (typeof order_index !== 'number') {
      return NextResponse.json({ success: false, error: 'El order_index debe ser un número' }, { status: 400 })
    }

    if (!color || typeof color !== 'string' || !color.startsWith('#')) {
      return NextResponse.json({ success: false, error: 'El color hexadecimal es requerido' }, { status: 400 })
    }

    // Insert state using any cast to bypass missing db type properties
    const { data: newState, error } = await (supabase
      .from('workflow_states') as any)
      .insert({
        name: name.trim(),
        order_index,
        color: color.trim(),
        is_initial: !!is_initial,
        is_terminal: !!is_terminal,
      })
      .select('*')
      .single()

    if (error) {
      console.error('[POST /api/workflow/states] Insert error:', error)
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: `Ya existe un estado con el nombre "${name}"` }, { status: 409 })
      }
      return NextResponse.json({ success: false, error: 'Error al guardar el estado en la base de datos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newState
    })

  } catch (err) {
    console.error('[POST /api/workflow/states] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
