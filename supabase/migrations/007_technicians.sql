-- 007_technicians.sql
-- Gestión de personal técnico y asignación múltiple a equipos (V2 - Limpia)

-- 1. Tabla de personal (maestro de técnicos)
CREATE TABLE IF NOT EXISTS public.technicians (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL, -- Sergio, Carlos, Luis, Gersson, etc.
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Insertar técnicos iniciales
INSERT INTO public.technicians (name) VALUES 
  ('Sergio'), ('Carlos'), ('Luis'), ('Gersson')
ON CONFLICT (name) DO NOTHING;

-- 3. Añadir columna de técnicos asignados y BORRAR columnas legacy
ALTER TABLE public.equipment_records 
ADD COLUMN IF NOT EXISTS assigned_technician_ids INTEGER[] DEFAULT '{}';

-- Limpieza: Eliminar columnas UUID antiguas que ya no se usan
ALTER TABLE public.equipment_records DROP COLUMN IF EXISTS diagnosis_tech_id;
ALTER TABLE public.equipment_records DROP COLUMN IF EXISTS maintenance_tech_id;

-- 4. Habilitar RLS para técnicos
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "technicians_select" ON public.technicians;
CREATE POLICY "technicians_select"
  ON public.technicians FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "technicians_write" ON public.technicians;
CREATE POLICY "technicians_write"
  ON public.technicians FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- 5. Actualizar la vista (Simplificada y sin JOINs innecesarios)
DROP VIEW IF EXISTS public.equipment_with_status;
CREATE VIEW public.equipment_with_status AS
SELECT
  er.*,
  ws.name  AS status_name,
  ws.color AS status_color,
  ws.is_terminal,
  -- Días transcurridos desde ingreso
  EXTRACT(DAY FROM NOW() - er.date_in)::INTEGER AS days_elapsed,
  -- Nombres de técnicos asignados (array de texto)
  (SELECT array_agg(t.name) 
   FROM public.technicians t 
   WHERE t.id = ANY(er.assigned_technician_ids)) AS assigned_technicians
FROM public.equipment_records er
JOIN public.workflow_states ws ON ws.id = er.current_status_id;
