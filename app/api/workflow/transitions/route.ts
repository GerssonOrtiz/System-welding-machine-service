// app/api/workflow/transitions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

async function checkSuperadmin(supabase: any) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { error: 'No autorizado', status: 401 }
  }

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('role, is_active, is_superadmin')
    .eq('id', session.user.id)
    .single()

  const activeProfile = userProfile as any
  if (!activeProfile || !activeProfile.is_active) {
    return { error: 'Cuenta no activa', status: 403 }
  }

  if (activeProfile.role !== 'superadmin' || !activeProfile.is_superadmin) {
    return { error: 'Acceso denegado. Solo el superadmin puede realizar esta acción', status: 403 }
  }

  return { success: true }
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    const check = await checkSuperadmin(supabase)
    if (check.error) {
      return NextResponse.json({ success: false, error: check.error }, { status: check.status })
    }

    const { data: transitions, error: tError } = await supabase
      .from('workflow_transitions')
      .select('*')

    if (tError) {
      console.error('[GET /api/workflow/transitions] Transitions fetch error:', tError)
      return NextResponse.json({ success: false, error: 'Error al obtener transiciones' }, { status: 500 })
    }

    const { data: states, error: sError } = await supabase
      .from('workflow_states')
      .select('id, name')

    if (sError) {
      console.error('[GET /api/workflow/transitions] States fetch error:', sError)
      return NextResponse.json({ success: false, error: 'Error al obtener estados' }, { status: 500 })
    }

    const stateMap = new Map((states || []).map((s: any) => [s.id, s.name]))

    const data = (transitions || []).map((t: any) => ({
      id: t.id,
      from_state_id: t.from_state_id,
      from_state_name: stateMap.get(t.from_state_id) || 'DESCONOCIDO',
      to_state_id: t.to_state_id,
      to_state_name: stateMap.get(t.to_state_id) || 'DESCONOCIDO',
      allowed_roles: t.allowed_roles,
    }))

    return NextResponse.json({
      success: true,
      data
    })

  } catch (err) {
    console.error('[GET /api/workflow/transitions] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const check = await checkSuperadmin(supabase)
    if (check.error) {
      return NextResponse.json({ success: false, error: check.error }, { status: check.status })
    }

    const body = await request.json()
    const { from_state_id, to_state_id, allowed_roles } = body

    if (typeof from_state_id !== 'number' || typeof to_state_id !== 'number') {
      return NextResponse.json({ success: false, error: 'Los campos from_state_id y to_state_id son requeridos y deben ser números' }, { status: 400 })
    }

    if (!Array.isArray(allowed_roles) || allowed_roles.some(r => typeof r !== 'string')) {
      return NextResponse.json({ success: false, error: 'allowed_roles debe ser un arreglo de roles válidos' }, { status: 400 })
    }

    // Verify both states exist
    const { count, error: existError } = await supabase
      .from('workflow_states')
      .select('*', { count: 'exact', head: true })
      .in('id', [from_state_id, to_state_id])

    if (existError || count !== 2) {
      // Unless they are the same state (loop transition), check if count is correct
      if (from_state_id === to_state_id && count === 1) {
        // Allow self-transitions if needed, though usually they are different
      } else {
        return NextResponse.json({ success: false, error: 'Uno o ambos estados no existen en el sistema' }, { status: 404 })
      }
    }

    const { data: newTransition, error: insertError } = await (supabase
      .from('workflow_transitions') as any)
      .insert({
        from_state_id,
        to_state_id,
        allowed_roles,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[POST /api/workflow/transitions] Insert error:', insertError)
      if (insertError.code === '23505') {
        return NextResponse.json({ success: false, error: 'Ya existe esta transición en el workflow' }, { status: 409 })
      }
      return NextResponse.json({ success: false, error: 'Error al registrar la transición' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: newTransition
    })

  } catch (err) {
    console.error('[POST /api/workflow/transitions] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
