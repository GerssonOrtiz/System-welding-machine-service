// app/api/workflow/transitions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authResult = await requireSuperadmin()
    if (!authResult.ok) return authResult.error
    const { supabase } = authResult.ctx

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
