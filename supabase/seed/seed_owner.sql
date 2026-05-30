-- ============================================================
-- Seed: Crear el perfil OWNER inicial
-- PASO 1: Crear el usuario en Authentication > Users (con email y contraseña)
-- PASO 2: Obtener el UUID del usuario creado
-- PASO 3: Reemplazar 'USER_UUID_AQUI' y ejecutar este script
-- ============================================================

-- Actualizar el perfil del usuario a OWNER
update public.profiles
set
  rol = 'owner',
  matricula = 'OWNER-001'
where id = 'USER_UUID_AQUI';  -- ← Reemplazar con el UUID real

-- Si el trigger no creó el perfil automáticamente, insertarlo manualmente:
-- insert into public.profiles (id, email, matricula, rol)
-- values ('USER_UUID_AQUI', 'owner@tudominio.com', 'OWNER-001', 'owner')
-- on conflict (id) do update set rol = 'owner';
