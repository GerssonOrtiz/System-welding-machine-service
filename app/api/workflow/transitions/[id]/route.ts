// app/api/workflow/transitions/[id]/route.ts
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

    const transitionId = parseInt(id, 10)
    if (isNaN(transitionId)) {
      return NextResponse.json({ success: false, error: 'ID de transición inválido' }, { status: 400 })
    }

    // Check if the transition exists
    const { data: existing, error: fetchError } = await supabase
      .from('workflow_transitions')
      .select('id')
      .eq('id', transitionId)
      .maybeSingle()

    if (fetchError || !existing) {
      return NextResponse.json({ success: false, error: 'Transición no encontrada' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('workflow_transitions')
      .delete()
      .eq('id', transitionId)

    if (deleteError) {
      console.error('[DELETE /api/workflow/transitions/[id]] Delete error:', deleteError)
      return NextResponse.json({ success: false, error: 'Error al eliminar la transición' }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (err) {
    console.error('[DELETE /api/workflow/transitions/[id]] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
