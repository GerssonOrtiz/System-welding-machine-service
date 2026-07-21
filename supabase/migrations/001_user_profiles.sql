-- 001_user_profiles.sql
-- Tipos y tabla de perfiles de usuario (vinculada a Supabase Auth)

-- Enum de roles disponibles
CREATE TYPE user_role_enum AS ENUM (
  'superadmin',
  'admin',
  'operaciones',
  'recepcion',
  'almacen',
  'visualizador'
);

-- Perfil extendido del usuario (vinculado a Supabase Auth)
CREATE TABLE public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  role          user_role_enum NOT NULL DEFAULT 'visualizador',
  is_active     BOOLEAN NOT NULL DEFAULT false,   -- false hasta que superadmin apruebe
  is_superadmin BOOLEAN NOT NULL DEFAULT false,   -- solo Venllas
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: crea perfil automáticamente cuando alguien se registra en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: protege al superadmin de eliminación y de cambios en su rol/flag
-- Permite cambiar otros campos como username
CREATE OR REPLACE FUNCTION public.protect_superadmin()
RETURNS TRIGGER AS $$
BEGIN
  -- Bloquear eliminación del superadmin
  IF TG_OP = 'DELETE' AND OLD.is_superadmin = true THEN
    RAISE EXCEPTION 'El superadmin no puede ser eliminado';
  END IF;

  -- Bloquear cambios en is_superadmin o role del superadmin
  IF TG_OP = 'UPDATE' AND OLD.is_superadmin = true THEN
    IF NEW.is_superadmin IS DISTINCT FROM OLD.is_superadmin
    OR NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'No se puede modificar el rol ni el flag is_superadmin del superadmin';
    END IF;
  END IF;

  -- RETURN COALESCE(NEW, OLD) maneja correctamente tanto UPDATE como DELETE
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_superadmin_modification
  BEFORE UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_superadmin();
