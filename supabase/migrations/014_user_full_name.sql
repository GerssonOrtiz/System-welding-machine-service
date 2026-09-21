-- 014_user_full_name.sql
-- Agrega columna full_name a la tabla user_profiles para registrar el nombre completo del usuario
-- y actualiza el trigger handle_new_user para capturarlo de raw_user_meta_data.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Actualizar función handle_new_user para poblar full_name si viene en user_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      username = EXCLUDED.username;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
