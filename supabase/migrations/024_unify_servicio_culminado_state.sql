-- 024_unify_servicio_culminado_state.sql
-- Unificación del estado "Listo para entrega" y "Servicio culminado"
-- Prevalece "Servicio culminado" según directiva de arquitectura:
-- En mantenimiento -> Servicio culminado -> Entregado

-- 1. Si existe un estado "Listo para entrega", actualizar su nombre a "Servicio culminado"
-- Si ya existe "Servicio culminado", aseguramos su configuración
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.workflow_states WHERE name = 'Listo para entrega') THEN
    UPDATE public.workflow_states
    SET name = 'Servicio culminado',
        color = '#10B981',
        is_terminal = false
    WHERE name = 'Listo para entrega';
  ELSE
    INSERT INTO public.workflow_states (name, order_index, is_initial, is_terminal, color)
    VALUES ('Servicio culminado', 8, false, false, '#10B981')
    ON CONFLICT (name) DO UPDATE
    SET color = '#10B981', is_terminal = false;
  END IF;
END $$;

-- 2. Asegurar transiciones unificadas en workflow_transitions
-- A) En mantenimiento -> Servicio culminado (operaciones, admin, superadmin)
INSERT INTO public.workflow_transitions (from_state_id, to_state_id, allowed_roles)
SELECT f.id, t.id, ARRAY['operaciones', 'admin', 'superadmin']
FROM public.workflow_states f, public.workflow_states t
WHERE f.name = 'En mantenimiento' AND t.name = 'Servicio culminado'
ON CONFLICT (from_state_id, to_state_id) 
DO UPDATE SET allowed_roles = ARRAY['operaciones', 'admin', 'superadmin'];

-- B) Servicio culminado -> Entregado (operaciones, admin, superadmin, recepcion)
INSERT INTO public.workflow_transitions (from_state_id, to_state_id, allowed_roles)
SELECT f.id, t.id, ARRAY['operaciones', 'admin', 'superadmin', 'recepcion']
FROM public.workflow_states f, public.workflow_states t
WHERE f.name = 'Servicio culminado' AND t.name = 'Entregado'
ON CONFLICT (from_state_id, to_state_id) 
DO UPDATE SET allowed_roles = ARRAY['operaciones', 'admin', 'superadmin', 'recepcion'];
