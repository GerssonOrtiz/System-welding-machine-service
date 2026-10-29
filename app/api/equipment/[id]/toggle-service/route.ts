// app/api/equipment/[id]/toggle-service/route.ts
// Endpoint para que Operaciones (operaciones, admin, superadmin) marque o desmarque
// un servicio aprobado como completado. Actualiza el registro interno sin alterar
// el status del workflow, sin historial y sin enviar correos.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api/auth'
import type { ApprovedPartItem } from '@/types/equipment'

const ALLOWED_ROLES = ['operaciones', 'admin', 'superadmin'] as const

const toggleServiceSchema = z.object({
  serviceId: z.string().min(1, 'El ID del servicio es requerido'),
  completed: z.boolean(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params

    // 1. Autenticación y permisos
    const authResult = await requireAuth('username, role, is_active')
    if (!authResult.ok) return authResult.error
    const { supabase, profile } = authResult.ctx

    if (!ALLOWED_ROLES.includes(profile.role as any)) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para actualizar el estado del servicio' },
        { status: 403 }
      )
    }

    // 2. Validar body
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Body inválido' }, { status: 400 })
    }

    const parsed = toggleServiceSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { serviceId, completed } = parsed.data

    // 3. Obtener approved_parts actual del equipo
    const { data: equipment, error: eqError } = await (supabase.from('equipment_records') as any)
      .select('id, approved_parts')
      .eq('id', equipmentId)
      .single()

    if (eqError || !equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipo no encontrado' },
        { status: 404 }
      )
    }

    const currentApprovedParts: ApprovedPartItem[] = Array.isArray(equipment.approved_parts)
      ? equipment.approved_parts
      : []

    // 4. Actualizar el servicio correspondiente
    let found = false
    const nowISO = new Date().toISOString()
    const updatedApprovedParts = currentApprovedParts.map((item) => {
      if (item.id === serviceId || (item.descripcion === serviceId && item.tipo === 'SERVICIO')) {
        found = true
        return {
          ...item,
          completed,
          completed_at: completed ? nowISO : undefined,
        }
      }
      return item
    })

    if (!found) {
      return NextResponse.json(
        { success: false, error: 'Servicio no encontrado en la lista del equipo' },
        { status: 404 }
      )
    }

    // 5. Guardar en BD (sin alterar status, sin triggers de status_history, sin correos)
    const { error: updateError } = await (supabase.from('equipment_records') as any)
      .update({
        approved_parts: updatedApprovedParts,
      })
      .eq('id', equipmentId)

    if (updateError) {
      console.error('[POST toggle-service] DB update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el servicio en la base de datos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        serviceId,
        completed,
        completed_at: completed ? nowISO : null,
      },
    })
  } catch (err: any) {
    console.error('[POST toggle-service] Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
