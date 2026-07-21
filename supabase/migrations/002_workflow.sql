-- 002_workflow.sql
-- Estados del flujo operativo y transiciones permitidas
-- Editables por el superadmin desde la UI sin tocar código

-- Estados del flujo operativo
CREATE TABLE public.workflow_states (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,        -- "En espera de diagnóstico"
  order_index INTEGER NOT NULL,            -- orden en la pizarra y tablas
  is_initial  BOOLEAN NOT NULL DEFAULT false,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  color       TEXT NOT NULL DEFAULT '#00E5FF', -- color para badge en UI
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transiciones permitidas entre estados
CREATE TABLE public.workflow_transitions (
  id                  SERIAL PRIMARY KEY,
  from_state_id       INTEGER NOT NULL REFERENCES public.workflow_states(id) ON DELETE CASCADE,
  to_state_id         INTEGER NOT NULL REFERENCES public.workflow_states(id) ON DELETE CASCADE,
  allowed_roles       TEXT[] NOT NULL,     -- ej: ['operaciones', 'admin', 'superadmin']
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_state_id, to_state_id)
);
