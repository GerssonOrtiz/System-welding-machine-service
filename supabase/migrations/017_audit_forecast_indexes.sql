-- 017_audit_forecast_indexes.sql
-- Índices para optimizar consultas del módulo de auditoría y pronóstico por modelo

CREATE INDEX IF NOT EXISTS idx_equipment_model ON public.equipment_records(model);
CREATE INDEX IF NOT EXISTS idx_equipment_brand_model ON public.equipment_records(brand, model);
CREATE INDEX IF NOT EXISTS idx_history_equipment_timestamp ON public.status_history(equipment_id, timestamp DESC);
