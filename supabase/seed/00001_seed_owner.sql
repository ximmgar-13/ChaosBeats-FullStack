-- Seed: crea el perfil del owner inicial si no existe.
-- Reemplaza los valores con los del owner real antes de ejecutar.
INSERT INTO public.profiles (id, email, matricula, rol)
VALUES (
  '00000000-0000-0000-0000-000000000000',  -- ← Reemplazar con el UUID de auth.users
  'owner@institucion.edu',
  'OWNER-001',
  'owner'
)
ON CONFLICT (id) DO NOTHING;
