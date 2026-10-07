-- 019_service_and_parts_status_separation.sql
-- Desacopla el Estado del Servicio del Estado de Repuestos

-- 1. Agregar columnas para seguimiento independiente de repuestos en equipment_records
ALTER TABLE public.equipment_records
ADD COLUMN IF NOT EXISTS parts_status TEXT DEFAULT 'SIN_REPUESTOS'
  CHECK (parts_status IN ('SIN_REPUESTOS', 'PARCIAL', 'COMPLETO')),
ADD COLUMN IF NOT EXISTS approved_parts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS parts_deliveries JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.equipment_records.parts_status IS
  'Estado logístico de repuestos: SIN_REPUESTOS, PARCIAL o COMPLETO.';

COMMENT ON COLUMN public.equipment_records.approved_parts IS
  'Lista estructurada de repuestos aprobados por Ventas: [{ id, descripcion, cantidad_solicitada, cantidad_entregada, precio }]';

COMMENT ON COLUMN public.equipment_records.parts_deliveries IS
  'Historial inmutable de entregas realizadas por Logística: [{ id, fecha, entregado_por, items: [{ descripcion, cantidad, nota }], observaciones }]';

-- 2. Asegurar que la vista equipment_with_status exponga los nuevos campos
DROP VIEW IF EXISTS public.equipment_with_status;
CREATE VIEW public.equipment_with_status AS
SELECT
  er.*,
  ws.name  AS status_name,
  ws.color AS status_color,
  ws.is_terminal,
  -- Días totales desde ingreso
  EXTRACT(DAY FROM NOW() - er.date_in)::INTEGER AS days_elapsed,
  
  -- Fase 1: Ingreso -> Pendiente de Aprobación
  CASE 
    WHEN er.pending_approval_at IS NOT NULL THEN EXTRACT(DAY FROM er.pending_approval_at - er.date_in)::INTEGER
    ELSE EXTRACT(DAY FROM NOW() - er.date_in)::INTEGER
  END AS phase_1_days,
  
  -- Fase 2: Pendiente de Aprobación -> Aprobado
  CASE 
    WHEN er.pending_approval_at IS NULL THEN 0
    WHEN er.approval_at IS NOT NULL THEN EXTRACT(DAY FROM er.approval_at - er.pending_approval_at)::INTEGER
    ELSE EXTRACT(DAY FROM NOW() - er.pending_approval_at)::INTEGER
  END AS phase_2_days,
  
  -- Fase 3: Aprobado -> Servicio Culminado (Entregado)
  CASE 
    WHEN er.approval_at IS NULL THEN 0
    WHEN er.finalized_at IS NOT NULL THEN EXTRACT(DAY FROM er.finalized_at - er.approval_at)::INTEGER
    ELSE EXTRACT(DAY FROM NOW() - er.approval_at)::INTEGER
  END AS phase_3_days,

  -- Nombres de técnicos asignados
  (SELECT array_agg(t.name) 
   FROM public.technicians t 
   WHERE t.id = ANY(er.assigned_technician_ids)) AS assigned_technicians
FROM public.equipment_records er
JOIN public.workflow_states ws ON ws.id = er.current_status_id;

-- 3. Transición directa Aprobado -> En mantenimiento para Operaciones, Admin y Superadmin (si no existiera)
INSERT INTO public.workflow_transitions (from_state_id, to_state_id, allowed_roles)
SELECT f.id, t.id, ARRAY['operaciones', 'admin', 'superadmin']
FROM public.workflow_states f, public.workflow_states t
WHERE f.name = 'Aprobado' AND t.name = 'En mantenimiento'
ON CONFLICT (from_state_id, to_state_id) 
DO UPDATE SET allowed_roles = ARRAY['operaciones', 'admin', 'superadmin'];

-- Transición directa En mantenimiento -> Entregado / Listo para entrega
INSERT INTO public.workflow_transitions (from_state_id, to_state_id, allowed_roles)
SELECT f.id, t.id, ARRAY['operaciones', 'admin', 'superadmin']
FROM public.workflow_states f, public.workflow_states t
WHERE f.name = 'En mantenimiento' AND t.name = 'Entregado'
ON CONFLICT (from_state_id, to_state_id) 
DO UPDATE SET allowed_roles = ARRAY['operaciones', 'admin', 'superadmin'];
