-- 003_equipment_records.sql
-- Tabla principal de equipos + triggers de timestamps operativos

-- Tipos enumerados
CREATE TYPE service_type_enum AS ENUM (
  'GARANTIA_CABELAB',
  'GARANTIA_ESAB',
  'REVISION_GENERAL'
);

CREATE TABLE public.equipment_records (

  -- 1. Identificadores
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fr_number       VARCHAR(50) NOT NULL UNIQUE,       -- Ficha de Recepción (siempre MAYÚSCULAS)
  report_number   VARCHAR(50),                        -- Número de informe (ingreso manual)

  -- 2. Datos del cliente y servicio
  client_name     VARCHAR(150) NOT NULL,              -- MAYÚSCULAS
  service_type    service_type_enum NOT NULL,

  -- 3. Estado actual en el workflow
  current_status_id INTEGER NOT NULL REFERENCES public.workflow_states(id),

  -- 4. Detalles técnicos del equipo
  brand           VARCHAR(100) NOT NULL,              -- MAYÚSCULAS
  model           VARCHAR(100) NOT NULL,              -- MAYÚSCULAS
  serial_number   VARCHAR(100) NOT NULL,              -- MAYÚSCULAS
  client_report   TEXT,                               -- Falla reportada por el cliente
  accessories     TEXT,                               -- Accesorios incluidos
  condition_in    TEXT,                               -- Condición física al ingreso
  additional_observations TEXT,                       -- Observaciones del técnico

  -- 5. Timestamps de auditoría de tiempos operativos
  date_in               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  start_diagnosis_at    TIMESTAMPTZ,                  -- Cuando pasa a EN_DIAGNOSTICO
  end_diagnosis_at      TIMESTAMPTZ,                  -- Cuando sale de EN_DIAGNOSTICO
  pending_approval_at   TIMESTAMPTZ,                  -- Cuando entra a PENDIENTE DE APROBACIÓN
  approval_at           TIMESTAMPTZ,                  -- Cuando se registra APROBADO
  start_maintenance_at  TIMESTAMPTZ,                  -- Cuando inicia EN_MANTENIMIENTO
  end_maintenance_at    TIMESTAMPTZ,                  -- Cuando termina EN_MANTENIMIENTO
  finalized_at          TIMESTAMPTZ,                  -- Cuando se registra ENTREGADO
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 6. Técnicos responsables (pueden ser personas distintas)
  diagnosis_tech_id     UUID REFERENCES auth.users(id),   -- Encargado de diagnóstico
  maintenance_tech_id   UUID REFERENCES auth.users(id),   -- Encargado de mantenimiento

  -- 7. Quién registró el equipo
  created_by            UUID REFERENCES auth.users(id)
);

-- Trigger: actualiza updated_at automáticamente en cada UPDATE
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.equipment_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: registra automáticamente los timestamps operativos al cambiar de estado
-- Evita que la API Route tenga que calcularlos manualmente
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

  -- Fin de diagnóstico (cuando sale del estado)
  IF old_state_name = 'En diagnóstico' AND new_state_name != 'En diagnóstico' THEN
    NEW.end_diagnosis_at = NOW();
  END IF;

  -- Pendiente de aprobación
  IF new_state_name = 'Pendiente de aprobación' AND COALESCE(old_state_name, '') != 'Pendiente de aprobación' THEN
    NEW.pending_approval_at = NOW();
  END IF;

  -- Aprobación registrada
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

  -- Finalizado (Entregado)
  IF new_state_name = 'Entregado' AND COALESCE(old_state_name, '') != 'Entregado' THEN
    NEW.finalized_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_track_timestamps
  BEFORE UPDATE OF current_status_id ON public.equipment_records
  FOR EACH ROW EXECUTE FUNCTION public.track_status_timestamps();
