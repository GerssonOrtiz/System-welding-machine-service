// app/api/workflow/states/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Middleware check helper
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const check = await checkSuperadmin(supabase)
    if (check.error) {
      return NextResponse.json({ success: false, error: check.error }, { status: check.status })
    }

    const stateId = parseInt(id, 10)
    if (isNaN(stateId)) {
      return NextResponse.json({ success: false, error: 'ID de estado inválido' }, { status: 400 })
    }

    // Get current state from DB
    const { data: existingState, error: fetchError } = await supabase
      .from('workflow_states')
      .select('*')
      .eq('id', stateId)
      .single()

    if (fetchError || !existingState) {
      return NextResponse.json({ success: false, error: 'Estado no encontrado' }, { status: 404 })
    }

    const activeExistingState = existingState as any
    const body = await request.json()
    const { name, order_index, color, is_initial, is_terminal } = body

    // Protected status check: "Entregado"
    if (activeExistingState.name === 'Entregado') {
      if (
        (is_initial !== undefined && is_initial !== activeExistingState.is_initial) ||
        (is_terminal !== undefined && is_terminal !== activeExistingState.is_terminal) ||
        (name !== undefined && name !== activeExistingState.name)
      ) {
        return NextResponse.json({
          success: false,
          error: 'El estado "Entregado" está protegido. No se puede modificar su nombre ni sus banderas de inicio/fin.'
        }, { status: 403 })
      }
    }

    // Build update object
    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (order_index !== undefined) updateData.order_index = order_index
    if (color !== undefined) updateData.color = color.trim()
    if (is_initial !== undefined) updateData.is_initial = !!is_initial
    if (is_terminal !== undefined) updateData.is_terminal = !!is_terminal

    const { data: updatedState, error: updateError } = await (supabase
      .from('workflow_states') as any)
      .update(updateData)
      .eq('id', stateId)
      .select('*')
      .single()

    if (updateError) {
      console.error('[PUT /api/workflow/states/[id]] Update error:', updateError)
      return NextResponse.json({ success: false, error: 'Error al actualizar el estado' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedState
    })

  } catch (err) {
    console.error('[PUT /api/workflow/states/[id]] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const check = await checkSuperadmin(supabase)
    if (check.error) {
      return NextResponse.json({ success: false, error: check.error }, { status: check.status })
    }

    const stateId = parseInt(id, 10)
    if (isNaN(stateId)) {
      return NextResponse.json({ success: false, error: 'ID de estado inválido' }, { status: 400 })
    }

    // Get the state first
    const { data: existingState, error: fetchError } = await supabase
      .from('workflow_states')
      .select('name')
      .eq('id', stateId)
      .single()

    if (fetchError || !existingState) {
      return NextResponse.json({ success: false, error: 'Estado no encontrado' }, { status: 404 })
    }

    const activeExistingState = existingState as any
    if (activeExistingState.name === 'Entregado') {
      return NextResponse.json({ success: false, error: 'El estado "Entregado" está protegido del sistema y no puede eliminarse' }, { status: 403 })
    }

    // Check if there are active equipment in this state
    const { count, error: countError } = await supabase
      .from('equipment_records')
      .select('*', { count: 'exact', head: true })
      .eq('current_status_id', stateId)

    if (countError) {
      console.error('[DELETE /api/workflow/states/[id]] Equipment count error:', countError)
      return NextResponse.json({ success: false, error: 'Error al verificar dependencias del estado' }, { status: 500 })
    }

    if (count && count > 0) {
      return NextResponse.json({
        success: false,
        error: 'No se puede eliminar un estado que tiene equipos activos'
      }, { status: 409 })
    }

    // Delete the state
    const { error: deleteError } = await supabase
      .from('workflow_states')
      .delete()
      .eq('id', stateId)

    if (deleteError) {
      console.error('[DELETE /api/workflow/states/[id]] Delete error:', deleteError)
      return NextResponse.json({ success: false, error: 'Error al eliminar el estado de la base de datos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (err) {
    console.error('[DELETE /api/workflow/states/[id]] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
