// types/catalog.ts
import type { Database } from '@/types/database.types'

export type CatalogBrand = Database['public']['Tables']['catalog_brands']['Row']
export type CatalogBrandInsert = Database['public']['Tables']['catalog_brands']['Insert']

export type CatalogModel = Database['public']['Tables']['catalog_models']['Row']
export type CatalogModelInsert = Database['public']['Tables']['catalog_models']['Insert']

export type Part = Database['public']['Tables']['parts_catalog']['Row']
export type PartInsert = Database['public']['Tables']['parts_catalog']['Insert']

export type PartCompatibility = Database['public']['Tables']['part_compatibilities']['Row']
export type PartCompatibilityInsert = Database['public']['Tables']['part_compatibilities']['Insert']

export interface CatalogModelWithBrand extends CatalogModel {
  brand_name?: string
}

export interface PartWithCompatibilities extends Part {
  compatible_models: CatalogModelWithBrand[]
}

export interface CatalogBrandWithModels extends CatalogBrand {
  models: CatalogModel[]
}
