-- 012_seed_major_brands.sql
-- Seed de marcas principales solicitadas por el usuario

INSERT INTO public.catalog_brands (name)
VALUES 
  ('ESAB'),
  ('MILLER'),
  ('LINCOLN ELECTRIC'),
  ('DAF'),
  ('KENDE'),
  ('TOYAKI'),
  ('HOBART'),
  ('HYPERTHERM')
ON CONFLICT (name) DO NOTHING;
