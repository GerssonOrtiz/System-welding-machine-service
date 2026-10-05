-- 016_status_history_role_and_comments.sql
-- Añade seguimiento del rol del usuario y comentarios/motivos opcionales en el historial de estados
-- para fines de auditoría y análisis de tiempos por rol.

-- 1. Añadir columnas a status_history
ALTER TABLE public.status_history
ADD COLUMN IF NOT EXISTS changed_by_role TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Añadir columna temporal status_change_notes en equipment_records
-- Esto permite que al actualizar equipment_records con notes, el trigger log_status_change()
-- capture las notas asociadas al cambio de estado en la fila correspondiente de status_history.
ALTER TABLE public.equipment_records
ADD COLUMN IF NOT EXISTS status_change_notes TEXT;

-- 3. Actualizar la función trigger para registrar el rol y las notas opcionales
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER AS $$
DECLARE
  old_state_name TEXT;
  new_state_name TEXT;
  user_role_val TEXT;
  user_name_val TEXT;
BEGIN
  SELECT name INTO old_state_name FROM public.workflow_states WHERE id = OLD.current_status_id;
  SELECT name INTO new_state_name FROM public.workflow_states WHERE id = NEW.current_status_id;

  IF OLD.current_status_id != NEW.current_status_id THEN
    -- Obtener username y rol del usuario actual
    SELECT username, role::TEXT INTO user_name_val, user_role_val
    FROM public.user_profiles
    WHERE id = auth.uid();

    INSERT INTO public.status_history (
      equipment_id,
      previous_status,
      new_status,
      changed_by_id,
      changed_by_username,
      changed_by_role,
      notes,
      timestamp
    ) VALUES (
      NEW.id,
      old_state_name,
      new_state_name,
      auth.uid(),
      COALESCE(user_name_val, 'Sistema'),
      user_role_val,
      NEW.status_change_notes,
      NOW()
    );

    -- Limpiar la nota temporal del registro principal para no retenerla en equipment_records
    NEW.status_change_notes := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
