// app/api/equipment/[id]/update-quote-status/route.ts
// Endpoint dedicado para que Recepción (recepcion, admin, superadmin)
// actualice el estado paralelo de la cotización: PENDIENTE, EN_COTIZACION, COTIZACION_LISTA.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api/auth'
import type { QuoteStatus } from '@/types/equipment'

const ALLOWED_ROLES = ['recepcion', 'admin', 'superadmin'] as const

const updateQuoteStatusSchema = z.object({
  quote_status: z.enum(['PENDIENTE', 'EN_COTIZACION', 'COTIZACION_LISTA']),
  notes: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params

    const authResult = await requireAuth('username, role, is_active')
    if (!authResult.ok) return authResult.error
    const { supabase, profile } = authResult.ctx

    if (!ALLOWED_ROLES.includes(profile.role as any)) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para modificar el estado de cotización.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateQuoteStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { quote_status, notes } = parsed.data

    // 1. Verificar existencia del equipo
    const { data: equipment, error: eqError } = await (supabase
      .from('equipment_records') as any)
      .select('id, fr_number, current_status_id, quote_status')
      .eq('id', equipmentId)
      .single()

    if (eqError || !equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      )
    }

    // 2. Actualizar quote_status en equipment_records
    const { error: updateError } = await (supabase
      .from('equipment_records') as any)
      .update({
        quote_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', equipmentId)

    if (updateError) {
      console.error('[POST update-quote-status] Error updating DB:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el estado de cotización' },
        { status: 500 }
      )
    }

    // 3. Registrar en status_history para auditoría
    await (supabase.from('status_history') as any).insert({
      equipment_id: equipmentId,
      previous_status_id: equipment.current_status_id,
      new_status_id: equipment.current_status_id,
      changed_by: profile.id,
      notes: notes
        ? `[Cotización: ${quote_status}] ${notes}`
        : `Estado de cotización actualizado a "${quote_status}" por Recepción (${profile.username})`,
      user_role: profile.role,
    }).catch((err: any) => {
      console.warn('[POST update-quote-status] Error inserting audit log:', err)
    })

    return NextResponse.json({
      success: true,
      data: {
        equipmentId,
        quote_status,
      },
    })
  } catch (error: any) {
    console.error('[POST update-quote-status] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
