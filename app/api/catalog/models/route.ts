import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawBrand = searchParams.get('brand')
    const brand = rawBrand ? rawBrand.trim().toUpperCase() : null

    // 1. Obtener de catalog_models (normalizado)
    let catalogQuery = supabase
      .from('catalog_models')
      .select('name, catalog_brands!inner(name)')
    
    if (brand) {
      catalogQuery = catalogQuery.ilike('catalog_brands.name', brand)
    }

    // 2. Obtener de equipment_records (histórico)
    let recordsQuery = supabase
      .from('equipment_records')
      .select('model')
    
    if (brand) {
      recordsQuery = recordsQuery.ilike('brand', brand)
    }

    const [catalogRes, recordsRes] = await Promise.all([
      catalogQuery,
      recordsQuery
    ])

    const catalogModels = catalogRes.data?.map(item => item.name) || []
    const recordModels = recordsRes.data?.map(item => item.model) || []

    // Combinar y eliminar duplicados, filtrando valores nulos o 'S/M'
    const allModels = Array.from(new Set([...catalogModels, ...recordModels]))
      .filter(model => model && model !== 'S/M')
      .sort()

    return NextResponse.json({
      success: true,
      data: allModels
    })

  } catch (err) {
    console.error('[GET /api/catalog/models] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
