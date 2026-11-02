-- 025_fix_status_history_rls.sql
-- Remediación de la política permisiva WITH CHECK (true) en status_history.
-- Se reemplaza por una política restrictiva que solo permite INSERT a:
-- 1. Superadmins (verificados contra user_profiles)
-- 2. Service Role (auth.role() = 'service_role'), usado por triggers SECURITY DEFINER

-- Eliminar la política permisiva existente
DROP POLICY IF EXISTS "history_insert_system_only" ON public.status_history;

-- Crear nueva política restrictiva
CREATE POLICY "history_insert_authorized_only"
  ON public.status_history FOR INSERT
  WITH CHECK (
    -- Permitir al Service Role (usado por triggers SECURITY DEFINER y createAdminClient)
    auth.role() = 'service_role'
    OR
    -- Permitir a superadmins autenticados
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_superadmin = true
        AND user_profiles.is_active = true
    )
  );
