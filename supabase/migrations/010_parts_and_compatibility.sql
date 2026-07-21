-- 010_parts_and_compatibility.sql
-- Tablas para el catálogo de marcas, modelos, repuestos y su relación de compatibilidad

-- 1. Catálogo de Marcas (Normalizado)
CREATE TABLE public.catalog_brands (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE, -- Ej: LINCOLN, MILLER, ESAB
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Catálogo de Modelos por Marca
CREATE TABLE public.catalog_models (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id    UUID NOT NULL REFERENCES public.catalog_brands(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL, -- Ej: VANTAGE 500
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, name)
);

-- 3. Catálogo Maestro de Repuestos (Piezas)
CREATE TABLE public.parts_catalog (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_number     VARCHAR(100) NOT NULL UNIQUE, -- Código de parte único
    name            VARCHAR(255) NOT NULL,        -- Nombre del repuesto
    specifications  TEXT,                         -- Especificaciones técnicas (Voltaje, Dimensiones, etc.)
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Compatibilidad (Relación Muchos a Muchos)
CREATE TABLE public.part_compatibilities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id     UUID NOT NULL REFERENCES public.parts_catalog(id) ON DELETE CASCADE,
    model_id    UUID NOT NULL REFERENCES public.catalog_models(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(part_id, model_id)
);

-- Trigger para updated_at en parts_catalog
CREATE TRIGGER set_updated_at_parts
    BEFORE UPDATE ON public.parts_catalog
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.catalog_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_compatibilities ENABLE ROW LEVEL SECURITY;

-- Lectura para todos los usuarios autenticados
CREATE POLICY "Allow read for all authenticated users" ON public.catalog_brands FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all authenticated users" ON public.catalog_models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all authenticated users" ON public.parts_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read for all authenticated users" ON public.part_compatibilities FOR SELECT TO authenticated USING (true);

-- Escritura solo para Superadmin (Asumiendo que el rol se maneja en user_profiles o similar)
-- Nota: Ajustar según cómo se identifique al Superadmin en el sistema
CREATE POLICY "Allow all for superadmin" ON public.catalog_brands FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
);
CREATE POLICY "Allow all for superadmin" ON public.catalog_models FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
);
CREATE POLICY "Allow all for superadmin" ON public.parts_catalog FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
);
CREATE POLICY "Allow all for superadmin" ON public.part_compatibilities FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
);
