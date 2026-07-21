-- 004_status_history.sql
-- Historial completo de cambios de estado por equipo

CREATE TABLE public.status_history (
  id              BIGSERIAL PRIMARY KEY,
  equipment_id    UUID NOT NULL REFERENCES public.equipment_records(id) ON DELETE CASCADE,

  -- Snapshot de nombres (para que el historial sea legible aunque cambien los estados)
  previous_status TEXT,                               -- NULL si es el primer estado
  new_status      TEXT NOT NULL,

  -- Quién hizo el cambio
  changed_by_id   UUID REFERENCES auth.users(id),
  changed_by_username TEXT NOT NULL,                  -- Snapshot del username al momento

  -- Si fue un override del superadmin
  is_override     BOOLEAN NOT NULL DEFAULT false,
  override_reason TEXT,                               -- Opcional: motivo del override

  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: registra automáticamente en historial cuando cambia el estado
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER AS $$
DECLARE
  old_state_name TEXT;
  new_state_name TEXT;
BEGIN
  SELECT name INTO old_state_name FROM public.workflow_states WHERE id = OLD.current_status_id;
  SELECT name INTO new_state_name FROM public.workflow_states WHERE id = NEW.current_status_id;

  IF OLD.current_status_id != NEW.current_status_id THEN
    INSERT INTO public.status_history (
      equipment_id,
      previous_status,
      new_status,
      changed_by_id,
      changed_by_username,
      timestamp
    ) VALUES (
      NEW.id,
      old_state_name,
      new_state_name,
      auth.uid(),
      COALESCE(
        (SELECT username FROM public.user_profiles WHERE id = auth.uid()),
        'Sistema'
      ),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_log_status_change
  AFTER UPDATE OF current_status_id ON public.equipment_records
  FOR EACH ROW EXECUTE FUNCTION public.log_status_change();
