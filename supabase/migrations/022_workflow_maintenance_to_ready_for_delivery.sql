-- 022_workflow_maintenance_to_ready_for_delivery.sql
-- Asegurar que el estado "Listo para entrega" exista en workflow_states
-- y habilitar la transición "En mantenimiento" -> "Listo para entrega" para operaciones, admin y superadmin.

-- 1. Insertar el estado "Listo para entrega" si no existe aún
INSERT INTO public.workflow_states (name, order_index, is_initial, is_terminal, color)
VALUES ('Listo para entrega', 8, false, false, '#10B981')
ON CONFLICT (name) DO UPDATE 
SET color = '#10B981', is_terminal = false;

-- 2. Asegurar que las transiciones desde "En mantenimiento" y hacia "Entregado" estén configuradas
-- A) En mantenimiento -> Listo para entrega (operaciones, admin, superadmin)
INSERT INTO public.workflow_transitions (from_state_id, to_state_id, allowed_roles)
SELECT f.id, t.id, ARRAY['operaciones', 'admin', 'superadmin']
FROM public.workflow_states f, public.workflow_states t
WHERE f.name = 'En mantenimiento' AND t.name = 'Listo para entrega'
ON CONFLICT (from_state_id, to_state_id) 
DO UPDATE SET allowed_roles = ARRAY['operaciones', 'admin', 'superadmin'];

-- B) Listo para entrega -> Entregado (operaciones, admin, superadmin, recepcion)
INSERT INTO public.workflow_transitions (from_state_id, to_state_id, allowed_roles)
SELECT f.id, t.id, ARRAY['operaciones', 'admin', 'superadmin', 'recepcion']
FROM public.workflow_states f, public.workflow_states t
WHERE f.name = 'Listo para entrega' AND t.name = 'Entregado'
ON CONFLICT (from_state_id, to_state_id) 
DO UPDATE SET allowed_roles = ARRAY['operaciones', 'admin', 'superadmin', 'recepcion'];
