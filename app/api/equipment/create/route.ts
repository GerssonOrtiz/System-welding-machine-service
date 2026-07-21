// app/api/equipment/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createEquipmentSchema } from '@/lib/validations/equipment.schema'
import { mailer } from '@/lib/mail/mailer'

export async function POST(request: NextRequest) {
  try {
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

    // 3. Validar rol con permisos de escritura
    const allowedRoles = ['superadmin', 'admin', 'recepcion']
    if (!allowedRoles.includes(activeProfile.role)) {
      return NextResponse.json({ success: false, error: 'No cuentas con permisos para crear equipos' }, { status: 403 })
    }

    // 4. Validar cuerpo con Zod
    const body = await request.json()
    const parsed = createEquipmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de equipo inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data } = parsed

    // 5. Normalizar todos los textos a MAYÚSCULAS
    const fr_number = data.fr_number.trim().toUpperCase()
    const client_name = data.client_name.trim().toUpperCase()
    const brand = data.brand?.trim() ? data.brand.trim().toUpperCase() : 'S/M'
    const model = data.model?.trim() ? data.model.trim().toUpperCase() : 'S/M'
    const serial_number = data.serial_number?.trim() ? data.serial_number.trim().toUpperCase() : 'N/S'
    const client_report = data.client_report?.trim().toUpperCase() || null
    const accessories = data.accessories?.trim().toUpperCase() || null
    const condition_in = data.condition_in?.trim().toUpperCase() || null
    const additional_observations = data.additional_observations?.trim().toUpperCase() || null

    // 6. Verificar si el número de FR ya existe
    const { data: existingFR } = await supabase
      .from('equipment_records')
      .select('id')
      .eq('fr_number', fr_number)
      .maybeSingle()

    if (existingFR) {
      return NextResponse.json(
        { success: false, error: `Ya existe un equipo registrado con la Ficha de Recepción ${fr_number}` },
        { status: 409 }
      )
    }

    // 7. Obtener el estado inicial de la BD (is_initial = true)
    const { data: initialState, error: stateError } = await supabase
      .from('workflow_states')
      .select('id')
      .eq('is_initial', true)
      .single()

    if (stateError || !initialState) {
      console.error('[POST /api/equipment/create] Initial workflow state not found:', stateError)
      return NextResponse.json(
        { success: false, error: 'Error de configuración del sistema: No se encontró un estado de workflow inicial' },
        { status: 500 }
      )
    }

    const activeInitialState = initialState as any

    // 8. Registrar marca y modelo en el catálogo si no existen
    if (brand !== 'S/M') {
      try {
        let brand_id: string | null = null

        const { data: existingBrand } = await supabase
          .from('catalog_brands')
          .select('id')
          .eq('name', brand)
          .maybeSingle()

        if (!existingBrand) {
          const { data: newBrand } = await supabase
            .from('catalog_brands')
            .insert({ name: brand })
            .select('id')
            .single()
          brand_id = (newBrand as any)?.id
        } else {
          brand_id = (existingBrand as any).id
        }

        // Si tenemos marca_id y el modelo no es S/M, registrar modelo
        if (brand_id && model !== 'S/M') {
          const { data: existingModel } = await supabase
            .from('catalog_models')
            .select('id')
            .eq('brand_id', brand_id)
            .eq('name', model)
            .maybeSingle()

          if (!existingModel) {
            await supabase
              .from('catalog_models')
              .insert({ 
                brand_id, 
                name: model 
              })
          }
        }
      } catch (catalogErr) {
        console.error('[POST /api/equipment/create] error updating catalog (brand/model):', catalogErr)
      }
    }

    // 9. Registrar equipo en la base de datos
    const { data: newEquipment, error: insertError } = await supabase
      .from('equipment_records')
      .insert({
        fr_number,
        client_name,
        service_type: data.service_type,
        brand,
        model,
        serial_number,
        client_report,
        accessories,
        condition_in,
        additional_observations,
        current_status_id: activeInitialState.id,
        created_by: session.user.id,
        priority_level: data.priority_level || 0,
        is_priority: (data.priority_level || 0) > 0,
      } as any)
      .select('id')
      .single()

    if (insertError || !newEquipment) {
      console.error('[POST /api/equipment/create] Error inserting equipment:', insertError)
      return NextResponse.json(
        { success: false, error: 'Ocurrió un error al registrar el equipo en la base de datos' },
        { status: 500 }
      )
    }

    const activeEquipment = newEquipment as any

    // 10. Enviar Notificación Interna (Email)
    try {
      // No bloqueamos el retorno de la API si el correo falla, pero lo intentamos
      mailer.sendEquipmentEntry({
        fr_number,
        client_name,
        brand,
        model,
        serial_number,
        service_type: data.service_type,
        client_report: client_report || 'SIN REPORTE',
        accessories: accessories || 'NINGUNO',
        is_priority: (data.priority_level || 0) > 0
      })
    } catch (mailErr) {
      console.error('[POST /api/equipment/create] Background mailer error:', mailErr)
    }

    return NextResponse.json({
      success: true,
      data: { id: activeEquipment.id }
    })

  } catch (err) {
    console.error('[POST /api/equipment/create] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
