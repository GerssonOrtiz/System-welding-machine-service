-- 013_email_thread.sql
-- Agrega soporte para correos en hilo por equipo.
-- email_thread_id: message-id del correo de ingreso (para enhebrar replies)
-- email_cc:        lista de correos CC elegidos al ingresar el equipo

ALTER TABLE equipment_records
  ADD COLUMN IF NOT EXISTS email_thread_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_cc        TEXT[] DEFAULT '{}';

COMMENT ON COLUMN equipment_records.email_thread_id IS
  'Message-ID del correo de ingreso devuelto por Resend. Usado como In-Reply-To en correos subsiguientes para mantener el hilo.';

COMMENT ON COLUMN equipment_records.email_cc IS
  'Lista de correos CC seleccionados al ingresar el equipo. Se reutilizan en todos los replies del hilo.';
