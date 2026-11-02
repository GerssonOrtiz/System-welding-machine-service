-- 026_performance_indexes.sql
-- Optimización costo-cero para mitigar cuellos de botella y reducir latencias en lecturas concurrentes

-- 1. Optimización para consultas públicas por FR (QR sin serial)
CREATE INDEX IF NOT EXISTS idx_equipment_fr_number_upper 
  ON public.equipment_records (UPPER(fr_number));

-- 2. Optimización para consultas públicas y búsqueda de máquinas por serial
CREATE INDEX IF NOT EXISTS idx_equipment_serial_number_upper 
  ON public.equipment_records (UPPER(serial_number));

-- 3. Optimización para Pizarra Kanban y listado operativo general
-- Filtra equipos activos excluyendo terminales y ordenando por prioridad/ingreso
CREATE INDEX IF NOT EXISTS idx_equipment_status_date_in 
  ON public.equipment_records (current_status_id, date_in DESC);

-- 4. Optimización de concurrencia optimista (OCC) en transiciones de estado
CREATE INDEX IF NOT EXISTS idx_equipment_occ 
  ON public.equipment_records (id, current_status_id);
