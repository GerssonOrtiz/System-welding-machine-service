-- 005_rls_policies.sql
-- Row Level Security — seguridad a nivel de base de datos

-- Activar RLS en todas las tablas públicas
ALTER TABLE public.user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_states      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history       ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- HELPERS: funciones reutilizables para verificar rol del usuario actual
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.user_profiles
  WHERE id = auth.uid() AND is_active = true
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT is_superadmin FROM public.user_profiles
  WHERE id = auth.uid() AND is_active = true
$$ LANGUAGE sql SECURITY DEFINER;

-- ─────────────────────────────────────────
-- POLÍTICAS: user_profiles
-- ─────────────────────────────────────────

-- Cada usuario ve su propio perfil; superadmin ve todos
CREATE POLICY "user_profiles_select"
  ON public.user_profiles FOR SELECT
  USING (id = auth.uid() OR public.is_superadmin());

-- Solo superadmin puede insertar/actualizar/eliminar perfiles
CREATE POLICY "user_profiles_write"
  ON public.user_profiles FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- ─────────────────────────────────────────
-- POLÍTICAS: workflow_states
-- ─────────────────────────────────────────

-- Todos los usuarios activos pueden leer los estados del workflow
CREATE POLICY "workflow_states_select"
  ON public.workflow_states FOR SELECT
  USING (public.get_current_user_role() IS NOT NULL);

-- Solo superadmin puede modificar el workflow
CREATE POLICY "workflow_states_write"
  ON public.workflow_states FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- ─────────────────────────────────────────
-- POLÍTICAS: workflow_transitions
-- ─────────────────────────────────────────

CREATE POLICY "workflow_transitions_select"
  ON public.workflow_transitions FOR SELECT
  USING (public.get_current_user_role() IS NOT NULL);

CREATE POLICY "workflow_transitions_write"
  ON public.workflow_transitions FOR ALL
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- ─────────────────────────────────────────
-- POLÍTICAS: equipment_records
-- ─────────────────────────────────────────

-- Todos los usuarios activos pueden leer equipos
CREATE POLICY "equipment_select"
  ON public.equipment_records FOR SELECT
  USING (public.get_current_user_role() IS NOT NULL);

-- Roles con permiso de escritura pueden insertar
CREATE POLICY "equipment_insert"
  ON public.equipment_records FOR INSERT
  WITH CHECK (
    public.get_current_user_role() IN ('superadmin', 'admin', 'recepcion')
  );

-- Roles operativos pueden actualizar
CREATE POLICY "equipment_update"
  ON public.equipment_records FOR UPDATE
  USING (
    public.get_current_user_role() IN ('superadmin', 'admin', 'operaciones', 'recepcion', 'almacen')
  );

-- Solo superadmin y admin pueden eliminar
CREATE POLICY "equipment_delete"
  ON public.equipment_records FOR DELETE
  USING (
    public.get_current_user_role() IN ('superadmin', 'admin')
  );

-- ─────────────────────────────────────────
-- POLÍTICAS: status_history
-- ─────────────────────────────────────────

-- Todos los activos pueden leer el historial
CREATE POLICY "history_select"
  ON public.status_history FOR SELECT
  USING (public.get_current_user_role() IS NOT NULL);

-- El INSERT siempre es ejecutado por triggers SECURITY DEFINER, no por usuarios directamente.
-- WITH CHECK (true) permite que los triggers escriban incluso cuando auth.uid() es NULL
-- (caso: createAdminClient en force-status del superadmin).
CREATE POLICY "history_insert_system_only"
  ON public.status_history FOR INSERT
  WITH CHECK (true);

-- ─────────────────────────────────────────
-- VISTA: equipment_with_status
-- Evita JOINs repetitivos en queries — incluye nombre/color del estado y días transcurridos
-- ─────────────────────────────────────────

CREATE VIEW public.equipment_with_status AS
SELECT
  er.*,
  ws.name  AS status_name,
  ws.color AS status_color,
  ws.is_terminal,
  -- Técnico de diagnóstico
  dp.username AS diagnosis_tech_username,
  -- Técnico de mantenimiento
  mp.username AS maintenance_tech_username,
  -- Días transcurridos desde ingreso
  EXTRACT(DAY FROM NOW() - er.date_in)::INTEGER AS days_elapsed
FROM public.equipment_records er
JOIN public.workflow_states ws ON ws.id = er.current_status_id
LEFT JOIN public.user_profiles dp ON dp.id = er.diagnosis_tech_id
LEFT JOIN public.user_profiles mp ON mp.id = er.maintenance_tech_id;

-- ─────────────────────────────────────────
-- ÍNDICES recomendados para rendimiento
-- ─────────────────────────────────────────

-- Búsqueda frecuente por FR
CREATE INDEX idx_equipment_fr_number ON public.equipment_records(fr_number);

-- Filtrado por estado (dashboard por rol)
CREATE INDEX idx_equipment_status ON public.equipment_records(current_status_id);

-- Historial por equipo
CREATE INDEX idx_history_equipment ON public.status_history(equipment_id);

-- Búsqueda por cliente
CREATE INDEX idx_equipment_client ON public.equipment_records(client_name);

-- Ordenamiento por fecha de ingreso
CREATE INDEX idx_equipment_date_in ON public.equipment_records(date_in DESC);
