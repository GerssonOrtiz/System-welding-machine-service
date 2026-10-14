// app/api/calendar/holidays/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * DELETE: Eliminar un día no hábil (solo superadmin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_superadmin, role')
      .eq('id', user.id)
      .single()

    if (!profile?.is_superadmin && profile?.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Solo el Superadministrador puede eliminar días no hábiles' }, { status: 403 })
    }

    const { error } = await supabase
      .from('non_business_days')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error inesperado' }, { status: 500 })
  }
}
