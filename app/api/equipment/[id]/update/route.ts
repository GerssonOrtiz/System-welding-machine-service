import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params
    const supabase = await createServerClient()

    // 1. Verificar sesión
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Obtener perfil
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, is_active, is_superadmin')
      .eq('id', session.user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ success: false, error: 'Perfil de usuario no encontrado' }, { status: 404 })
    }

    const activeProfile = userProfile as any

    if (!activeProfile.is_active) {
      return NextResponse.json({ success: false, error: 'Cuenta no activa' }, { status: 403 })
    }

    // 3. Verificar que sea superadmin
    if (activeProfile.role !== 'superadmin' || !activeProfile.is_superadmin) {
      return NextResponse.json({ success: false, error: 'Acceso denegado. Solo el superadmin puede modificar toda la información de un equipo' }, { status: 403 })
    }

    // 4. Leer cuerpo
    const body = await request.json()

    // Normalizar a mayúsculas como en la creación
    const updateData: any = {}
    if (body.fr_number !== undefined) updateData.fr_number = body.fr_number.trim().toUpperCase()
    if (body.client_name !== undefined) updateData.client_name = body.client_name.trim().toUpperCase()
    if (body.brand !== undefined) updateData.brand = body.brand.trim() ? body.brand.trim().toUpperCase() : 'S/M'
    if (body.model !== undefined) updateData.model = body.model.trim() ? body.model.trim().toUpperCase() : 'S/M'
    if (body.serial_number !== undefined) updateData.serial_number = body.serial_number.trim() ? body.serial_number.trim().toUpperCase() : 'N/S'
    
    if (body.report_number !== undefined) updateData.report_number = body.report_number.trim().toUpperCase() || null
    if (body.client_report !== undefined) updateData.client_report = body.client_report.trim().toUpperCase() || null
    if (body.accessories !== undefined) updateData.accessories = body.accessories.trim().toUpperCase() || null
    if (body.condition_in !== undefined) updateData.condition_in = body.condition_in.trim().toUpperCase() || null
    if (body.additional_observations !== undefined) updateData.additional_observations = body.additional_observations.trim().toUpperCase() || null
    
    if (body.service_type !== undefined) updateData.service_type = body.service_type
    if (body.date_in !== undefined) updateData.date_in = body.date_in
    if (body.priority_level !== undefined) {
      updateData.priority_level = body.priority_level
      updateData.is_priority = body.priority_level > 0
    } else if (body.is_priority !== undefined) {
      updateData.is_priority = body.is_priority
    }

    // Timestamps operativos (solo superadmin puede enviarlos)
    if (body.start_diagnosis_at !== undefined) updateData.start_diagnosis_at = body.start_diagnosis_at
    if (body.end_diagnosis_at !== undefined) updateData.end_diagnosis_at = body.end_diagnosis_at
    if (body.pending_approval_at !== undefined) updateData.pending_approval_at = body.pending_approval_at
    if (body.approval_at !== undefined) updateData.approval_at = body.approval_at
    if (body.start_maintenance_at !== undefined) updateData.start_maintenance_at = body.start_maintenance_at
    if (body.end_maintenance_at !== undefined) updateData.end_maintenance_at = body.end_maintenance_at
    if (body.finalized_at !== undefined) updateData.finalized_at = body.finalized_at

    // 5. Validaciones mínimas
    if (updateData.client_name === '') return NextResponse.json({ success: false, error: 'El cliente no puede estar vacío' }, { status: 400 })
    if (updateData.fr_number === '') return NextResponse.json({ success: false, error: 'El número de FR no puede estar vacío' }, { status: 400 })

    // 6. Verificar si el nuevo FR ya existe en otro equipo
    if (updateData.fr_number) {
      const { data: existingFR } = await supabase
        .from('equipment_records')
        .select('id')
        .eq('fr_number', updateData.fr_number)
        .neq('id', equipmentId)
        .maybeSingle()

      if (existingFR) {
        return NextResponse.json(
          { success: false, error: `Ya existe otro equipo registrado con la Ficha de Recepción ${updateData.fr_number}` },
          { status: 409 }
        )
      }
    }

    // 7. Actualizar equipo
    const { error: updateError } = await (supabase
      .from('equipment_records') as any)
      .update(updateData)
      .eq('id', equipmentId)

    if (updateError) {
      console.error('[PUT /api/equipment/[id]/update] Update error:', updateError)
      return NextResponse.json({ success: false, error: 'Error al actualizar el equipo en la base de datos: ' + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[PUT /api/equipment/[id]/update] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor: ' + (err?.message || '') }, { status: 500 })
  }
}
