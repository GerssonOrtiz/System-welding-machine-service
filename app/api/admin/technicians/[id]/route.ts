// app/api/admin/technicians/[id]/route.ts
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

    // Borrado físico (solo si no tiene equipos asociados, si no fallará por FK - es más seguro)
    const technicianId = parseInt(id, 10)
    
    if (isNaN(technicianId)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('technicians')
      .delete()
      .eq('id', technicianId)

    if (error) {
      // Si falla por integridad (FK), desactivarlo en lugar de borrarlo
      if (error.code === '23503') {
        await supabase.from('technicians').update({ is_active: false }).eq('id', technicianId)
        return NextResponse.json({ success: true, message: 'Técnico desactivado (tiene historial)' })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
