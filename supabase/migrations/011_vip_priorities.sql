-- 011_vip_priorities.sql
-- Actualiza el sistema de prioridades de booleano a 3 niveles VIP

-- 1. Añadir columna priority_level
ALTER TABLE public.equipment_records 
ADD COLUMN IF NOT EXISTS priority_level INTEGER NOT NULL DEFAULT 0;

-- 2. Migrar datos existentes (si is_priority era true, poner priority_level = 1)
UPDATE public.equipment_records 
SET priority_level = 1 
WHERE is_priority = true AND priority_level = 0;

-- 3. Actualizar la vista equipment_with_status para incluir priority_level
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
