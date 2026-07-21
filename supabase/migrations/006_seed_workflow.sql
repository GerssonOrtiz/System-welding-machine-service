-- 006_seed_workflow.sql
-- Datos iniciales simplificados: 8 estados operativos

-- Limpiar datos previos si existen (evitar duplicados en re-ejecución)
TRUNCATE public.workflow_transitions CASCADE;
TRUNCATE public.workflow_states CASCADE;

-- Estados simplificados
INSERT INTO public.workflow_states (name, order_index, is_initial, is_terminal, color) VALUES
  ('En espera de diagnóstico',        1,  true,  false, '#00E5FF'),
  ('En diagnóstico',                  2,  false, false, '#0052FF'),
  ('Coordinación con el cliente',     3,  false, false, '#F59E0B'),
  ('En espera de repuesto',           4,  false, false, '#9D4EDD'),
  ('Pendiente de aprobación',         5,  false, false, '#F59E0B'),
  ('Aprobado',                        6,  false, false, '#10B981'),
  ('En mantenimiento',                7,  false, false, '#0052FF'),
  ('En espera de repuesto adicional', 8,  false, false, '#9D4EDD'),
  ('Entregado',                       9,  false, true,  '#10B981');

-- Transiciones permitidas entre estados
INSERT INTO public.workflow_transitions (from_state_id, to_state_id, allowed_roles)
SELECT f.id, t.id, roles.allowed
FROM (VALUES
  ('En espera de diagnóstico',        'En diagnóstico',                   ARRAY['operaciones','admin','superadmin']),
  ('En diagnóstico',                  'Coordinación con el cliente',      ARRAY['operaciones','admin','superadmin']),
  ('Coordinación con el cliente',     'En diagnóstico',                   ARRAY['operaciones','admin','superadmin']),
  ('En diagnóstico',                  'En espera de repuesto',            ARRAY['operaciones','admin','superadmin']),
  ('En diagnóstico',                  'Pendiente de aprobación',          ARRAY['operaciones','admin','superadmin']),
  ('Coordinación con el cliente',     'Pendiente de aprobación',          ARRAY['operaciones','admin','superadmin']),
  ('En espera de repuesto',           'En diagnóstico',                   ARRAY['operaciones','admin','superadmin']),
  ('Pendiente de aprobación',         'Aprobado',                         ARRAY['recepcion','admin','superadmin']),
  ('Aprobado',                        'En mantenimiento',                 ARRAY['operaciones','admin','superadmin']),
  ('En mantenimiento',                'En espera de repuesto adicional',  ARRAY['operaciones','admin','superadmin']),
  ('En mantenimiento',                'Entregado',                        ARRAY['operaciones','admin','superadmin']),
  ('En espera de repuesto adicional', 'En mantenimiento',                 ARRAY['operaciones','admin','superadmin']),
  ('En espera de repuesto',           'Aprobado',                         ARRAY['almacen','admin','superadmin']),
  ('En espera de repuesto adicional', 'Entregado',                        ARRAY['almacen','admin','superadmin'])
) AS roles(from_name, to_name, allowed)
JOIN public.workflow_states f ON f.name = roles.from_name
JOIN public.workflow_states t ON t.name = roles.to_name;

