-- 018_batch_equipment_and_thread_subject.sql
-- Soporte para ingreso múltiple de equipos en un solo correo y persistencia del asunto de hilo exacto.

-- 1. Agregar batch_id (UUID opcional para agrupar equipos creados juntos)
-- 2. Agregar email_thread_subject (asunto original del hilo para asegurar que todos los replies lo usen)
ALTER TABLE public.equipment_records
ADD COLUMN IF NOT EXISTS batch_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_thread_subject TEXT DEFAULT NULL;

COMMENT ON COLUMN public.equipment_records.batch_id IS
  'UUID compartido por todos los equipos creados en la misma tanda de ingreso.';

COMMENT ON COLUMN public.equipment_records.email_thread_subject IS
  'Asunto original del correo de ingreso. Reutilizado en replies (RE: ...) para garantizar el threading exacto en Gmail/Outlook.';

-- Índice para búsquedas rápidas por lote si se requiere
CREATE INDEX IF NOT EXISTS idx_equipment_batch_id ON public.equipment_records(batch_id);
