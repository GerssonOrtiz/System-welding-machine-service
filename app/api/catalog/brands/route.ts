import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api/auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.ok) return authResult.error
    const { supabase } = authResult.ctx

    // 1. Obtener de catalog_brands (normalizado)
    const { data: catalogData } = await supabase
      .from('catalog_brands')
      .select('name')

    // 2. Obtener de equipment_records (histórico)
    const { data: recordsData } = await supabase
      .from('equipment_records')
      .select('brand')

    const catalogBrands = catalogData?.map(item => item.name) || []
    const recordBrands = recordsData?.map(item => item.brand) || []

    // Combinar y eliminar duplicados, filtrando valores nulos o 'S/M'
    const allBrands = Array.from(new Set([...catalogBrands, ...recordBrands]))
      .filter(brand => brand && brand !== 'S/M')
      .sort()

    return NextResponse.json({
      success: true,
      data: allBrands
    })

  } catch (err) {
    console.error('[GET /api/catalog/brands] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
