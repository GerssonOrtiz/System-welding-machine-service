-- 023_fix_catalog_rls.sql
-- Corrección de políticas RLS en catálogos de repuestos y marcas.
-- En 010_parts_and_compatibility.sql se usó 'SUPERADMIN' en mayúsculas, pero los roles
-- en user_profiles y user_role_enum están en minúsculas ('superadmin').
-- Además, se soporta la función utilitaria public.is_superadmin().

-- 1. Eliminar políticas restrictivas anteriores con case incorrecto
DROP POLICY IF EXISTS "Allow all for superadmin" ON public.catalog_brands;
DROP POLICY IF EXISTS "Allow all for superadmin" ON public.catalog_models;
DROP POLICY IF EXISTS "Allow all for superadmin" ON public.parts_catalog;
DROP POLICY IF EXISTS "Allow all for superadmin" ON public.part_compatibilities;

-- 2. Crear nuevas políticas con verificación robusta de superadmin
CREATE POLICY "Allow all for superadmin" ON public.catalog_brands 
FOR ALL TO authenticated 
USING (
  public.is_superadmin() OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND lower(role::text) = 'superadmin'
  )
);

CREATE POLICY "Allow all for superadmin" ON public.catalog_models 
FOR ALL TO authenticated 
USING (
  public.is_superadmin() OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND lower(role::text) = 'superadmin'
  )
);

CREATE POLICY "Allow all for superadmin" ON public.parts_catalog 
FOR ALL TO authenticated 
USING (
  public.is_superadmin() OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND lower(role::text) = 'superadmin'
  )
);

CREATE POLICY "Allow all for superadmin" ON public.part_compatibilities 
FOR ALL TO authenticated 
USING (
  public.is_superadmin() OR EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND lower(role::text) = 'superadmin'
  )
);
