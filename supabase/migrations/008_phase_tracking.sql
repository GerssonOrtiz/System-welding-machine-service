-- 008_phase_tracking.sql
-- Añade seguimiento de tiempos por fases y actualiza la vista

-- 1. Añadir columnas de timestamps para fases específicas
ALTER TABLE public.equipment_records 
ADD COLUMN IF NOT EXISTS pending_approval_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;

-- 2. Actualizar el trigger para capturar estos nuevos hitos
CREATE OR REPLACE FUNCTION public.track_status_timestamps()
RETURNS TRIGGER AS $$
DECLARE
  new_state_name TEXT;
  old_state_name TEXT;
BEGIN
  SELECT name INTO new_state_name FROM public.workflow_states WHERE id = NEW.current_status_id;
  SELECT name INTO old_state_name FROM public.workflow_states WHERE id = OLD.current_status_id;

  -- Inicio de diagnóstico
  IF new_state_name = 'En diagnóstico' AND COALESCE(old_state_name, '') != 'En diagnóstico' THEN
    NEW.start_diagnosis_at = NOW();
  END IF;

  -- Fin de diagnóstico
  IF old_state_name = 'En diagnóstico' AND new_state_name != 'En diagnóstico' THEN
    NEW.end_diagnosis_at = NOW();
  END IF;

  -- Pendiente de aprobación (Hito Fase 1 -> 2)
  IF new_state_name = 'Pendiente de aprobación' AND COALESCE(old_state_name, '') != 'Pendiente de aprobación' THEN
    NEW.pending_approval_at = NOW();
  END IF;

  -- Aprobación registrada (Hito Fase 2 -> 3)
  IF new_state_name = 'Aprobado' AND COALESCE(old_state_name, '') != 'Aprobado' THEN
    NEW.approval_at = NOW();
  END IF;

  -- Inicio de mantenimiento
  IF new_state_name = 'En mantenimiento' AND COALESCE(old_state_name, '') != 'En mantenimiento' THEN
    NEW.start_maintenance_at = NOW();
  END IF;

  -- Fin de mantenimiento
  IF old_state_name = 'En mantenimiento' AND new_state_name != 'En mantenimiento' THEN
    NEW.end_maintenance_at = NOW();
  END IF;

  -- Finalizado / Entregado (Hito Final)
  IF new_state_name = 'Entregado' AND COALESCE(old_state_name, '') != 'Entregado' THEN
    NEW.finalized_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar la vista para incluir el cálculo de días por fase
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
