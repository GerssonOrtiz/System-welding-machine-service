-- 020_non_business_days.sql
-- Tabla para registrar días no hábiles (feriados, asuetos, paradas) gestionables por el superadmin.
-- Utilizada por el motor de pronóstico predictivo y la calculadora de entrega de equipos.

CREATE TABLE IF NOT EXISTS public.non_business_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date DATE NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.non_business_days IS
  'Días no laborales y feriados adicionales a sábados y domingos para el cálculo de tiempos y entrega predictiva.';

-- Activar Row Level Security
ALTER TABLE public.non_business_days ENABLE ROW LEVEL SECURITY;

-- Políticas RLS:
-- 1. Cualquier usuario autenticado y activo puede leer los días no hábiles
CREATE POLICY "non_business_days_select"
  ON public.non_business_days FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 2. Solo el superadmin puede insertar, actualizar o eliminar días no hábiles
CREATE POLICY "non_business_days_insert"
  ON public.non_business_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_superadmin = true
        AND user_profiles.is_active = true
    )
  );

CREATE POLICY "non_business_days_update"
  ON public.non_business_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_superadmin = true
        AND user_profiles.is_active = true
    )
  );

CREATE POLICY "non_business_days_delete"
  ON public.non_business_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.is_superadmin = true
        AND user_profiles.is_active = true
    )
  );

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_non_business_days_date ON public.non_business_days(holiday_date ASC);
