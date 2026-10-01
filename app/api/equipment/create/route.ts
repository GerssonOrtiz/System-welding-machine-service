// app/api/equipment/create/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createEquipmentSchema } from '@/lib/validations/equipment.schema'
import { mailer } from '@/lib/mail/mailer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // ============================================================
    // 1. VERIFICAR USUARIO AUTENTICADO
    // ============================================================

    // getUser() verifica el usuario directamente con Supabase Auth.
    // Es preferible a getSession() para validar identidad en el servidor.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
        },
        { status: 401 }
      )
    }

    // ============================================================
    // 2. OBTENER PERFIL DEL USUARIO
    // ============================================================

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, is_active, is_superadmin')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.error(
        '[POST /api/equipment/create] User profile error:',
        profileError
      )

      return NextResponse.json(
        {
          success: false,
          error: 'Perfil de usuario no encontrado',
        },
        { status: 404 }
      )
    }

    // ============================================================
    // 3. VERIFICAR ESTADO DE LA CUENTA
    // ============================================================

    if (!userProfile.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cuenta no activa',
        },
        { status: 403 }
      )
    }

    // ============================================================
    // 4. VERIFICAR PERMISOS
    // ============================================================

    const allowedRoles = [
      'superadmin',
      'admin',
      'recepcion',
    ]

    if (!allowedRoles.includes(userProfile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No cuentas con permisos para crear equipos',
        },
        { status: 403 }
      )
    }

    // ============================================================
    // 5. LEER Y VALIDAR BODY
    // ============================================================

    const body = await request.json()

    const parsed = createEquipmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de equipo inválidos',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { data } = parsed

    // ============================================================
    // 6. NORMALIZAR DATOS
    // ============================================================

    const fr_number = data.fr_number.trim().toUpperCase()

    const client_name = data.client_name.trim().toUpperCase()

    const brand = data.brand?.trim()
      ? data.brand.trim().toUpperCase()
      : 'S/M'

    const model = data.model?.trim()
      ? data.model.trim().toUpperCase()
      : 'S/M'

    const serial_number = data.serial_number?.trim()
      ? data.serial_number.trim().toUpperCase()
      : 'N/S'

    const client_report =
      data.client_report?.trim().toUpperCase() || null

    const accessories =
      data.accessories?.trim().toUpperCase() || null

    const condition_in =
      data.condition_in?.trim().toUpperCase() || null

    const additional_observations =
      data.additional_observations?.trim().toUpperCase() || null

    // CC se utiliza para el correo.
    // NO se guarda en equipment_records porque la columna email_cc
    // no existe actualmente en Supabase.
    const cc_extra: string[] = data.cc_extra ?? []

    // ============================================================
    // 7. VERIFICAR SI EL FR YA EXISTE
    // ============================================================

    const {
      data: existingFR,
      error: existingFRError,
    } = await supabase
      .from('equipment_records')
      .select('id')
      .eq('fr_number', fr_number)
      .maybeSingle()

    if (existingFRError) {
      console.error(
        '[POST /api/equipment/create] Error checking FR:',
        existingFRError
      )

      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo verificar si la Ficha de Recepción ya existe',
        },
        { status: 500 }
      )
    }

    if (existingFR) {
      return NextResponse.json(
        {
          success: false,
          error: `Ya existe un equipo registrado con la Ficha de Recepción ${fr_number}`,
        },
        { status: 409 }
      )
    }

    // ============================================================
    // 8. OBTENER ESTADO INICIAL DEL WORKFLOW
    // ============================================================

    const {
      data: initialState,
      error: stateError,
    } = await supabase
      .from('workflow_states')
      .select('id')
      .eq('is_initial', true)
      .single()

    if (stateError || !initialState) {
      console.error(
        '[POST /api/equipment/create] Initial workflow state not found:',
        stateError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Error de configuración del sistema: No se encontró un estado de workflow inicial',
        },
        { status: 500 }
      )
    }

    // ============================================================
    // 9. REGISTRAR MARCA Y MODELO EN EL CATÁLOGO
    // ============================================================

    if (brand !== 'S/M') {
      try {
        let brand_id: string | null = null

        // --------------------------------------------------------
        // Buscar marca
        // --------------------------------------------------------

        const {
          data: existingBrand,
          error: existingBrandError,
        } = await supabase
          .from('catalog_brands')
          .select('id')
          .eq('name', brand)
          .maybeSingle()

        if (existingBrandError) {
          console.error(
            '[POST /api/equipment/create] Error checking brand:',
            existingBrandError
          )
        }

        // --------------------------------------------------------
        // Crear marca si no existe
        // --------------------------------------------------------

        if (!existingBrand) {
          const {
            data: newBrand,
            error: newBrandError,
          } = await supabase
            .from('catalog_brands')
            .insert({
              name: brand,
            })
            .select('id')
            .single()

          if (newBrandError) {
            console.error(
              '[POST /api/equipment/create] Error creating brand:',
              newBrandError
            )
          } else {
            brand_id = newBrand?.id ?? null
          }
        } else {
          brand_id = existingBrand.id
        }

        // --------------------------------------------------------
        // Registrar modelo
        // --------------------------------------------------------

        if (brand_id && model !== 'S/M') {
          const {
            data: existingModel,
            error: existingModelError,
          } = await supabase
            .from('catalog_models')
            .select('id')
            .eq('brand_id', brand_id)
            .eq('name', model)
            .maybeSingle()

          if (existingModelError) {
            console.error(
              '[POST /api/equipment/create] Error checking model:',
              existingModelError
            )
          }

          if (!existingModel) {
            const { error: newModelError } = await supabase
              .from('catalog_models')
              .insert({
                brand_id,
                name: model,
              })

            if (newModelError) {
              console.error(
                '[POST /api/equipment/create] Error creating model:',
                newModelError
              )
            }
          }
        }
      } catch (catalogErr) {
        // Un error de catálogo NO debe impedir registrar el equipo.
        console.error(
          '[POST /api/equipment/create] Error updating catalog:',
          catalogErr
        )
      }
    }

    // ============================================================
    // 10. REGISTRAR EQUIPO
    // ============================================================

    // IMPORTANTE:
    // NO se incluye:
    //
    // email_cc: cc_extra
    //
    // porque esa columna NO existe actualmente en equipment_records.

    const {
      data: newEquipment,
      error: insertError,
    } = await supabase
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

        current_status_id: initialState.id,

        created_by: user.id,

        priority_level: data.priority_level || 0,

        is_priority: (data.priority_level || 0) > 0,

        report_url:
          data.report_url?.trim() || null,
      })
      .select('id')
      .single()

    // ============================================================
    // 11. VERIFICAR INSERCIÓN
    // ============================================================

    if (insertError || !newEquipment) {
      console.error(
        '[POST /api/equipment/create] Error inserting equipment:',
        insertError
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Ocurrió un error al registrar el equipo en la base de datos',
        },
        { status: 500 }
      )
    }

    const equipmentId = newEquipment.id

    // ============================================================
    // 12. ENVIAR CORREO DE INGRESO
    // ============================================================

    let mailWarning: string | null = null

    try {
      const mailResult = await mailer.sendEquipmentEntry(
        {
          fr_number,
          client_name,
          brand,
          model,
          serial_number,
          service_type: data.service_type,

          client_report:
            client_report || 'SIN REPORTE',

          accessories:
            accessories || 'NINGUNO',

          is_priority:
            (data.priority_level || 0) > 0,
        },
        cc_extra
      )

      // ==========================================================
      // 13. GUARDAR ID DEL HILO DE CORREO
      // ==========================================================

      if (mailResult.success && mailResult.messageId) {
        const { error: threadError } = await supabase
          .from('equipment_records')
          .update({
            email_thread_id: mailResult.messageId,
          })
          .eq('id', equipmentId)

        if (threadError) {
          console.error(
            '[POST /api/equipment/create] Error saving email thread ID:',
            threadError
          )

          // El equipo ya fue creado correctamente.
          // Solo dejamos advertencia.
          mailWarning =
            'El equipo fue registrado, pero no se pudo guardar el identificador del correo.'
        }
      } else if (
        !mailResult.success &&
        !mailResult.skipped
      ) {
        mailWarning =
          mailResult.error ||
          'No se pudo enviar el correo de ingreso'
      }
    } catch (mailErr) {
      console.error(
        '[POST /api/equipment/create] Mailer error:',
        mailErr
      )

      // No hacemos rollback del equipo.
      // El registro ya existe correctamente.
      mailWarning =
        'El equipo fue registrado, pero ocurrió un error al enviar el correo de notificación.'
    }

    // ============================================================
    // 14. RESPUESTA EXITOSA
    // ============================================================

    return NextResponse.json({
      success: true,

      data: {
        id: equipmentId,
      },

      warning: mailWarning,
    })
  } catch (err) {
    // ============================================================
    // ERROR NO CONTROLADO
    // ============================================================

    console.error(
      '[POST /api/equipment/create] Unexpected error:',
      err
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}