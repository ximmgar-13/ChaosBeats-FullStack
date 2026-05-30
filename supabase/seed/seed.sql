-- Seed data for development
-- Ejecutar DESPUÉS de haber creado al menos un usuario en Auth.

-- Insertar canciones de ejemplo (reemplazar USER_UUID con un id real de profiles)
-- insert into public.songs (artist_id, title, album, genre, duration_seconds, audio_url, cover_url, is_published)
-- values
--   ('USER_UUID', 'Mi Primer Beat', 'Álbum Inicial', 'hip-hop', 180, '/audio/beat1.mp3', null, true),
--   ('USER_UUID', 'Noche de Caos', 'Álbum Inicial', 'electronic', 240, '/audio/beat2.mp3', null, true);

-- Insertar versiones de la app
insert into public.app_versions (platform, version, build_number, is_required, release_notes)
values
  ('ios', '1.0.0', 1, false, 'Initial release'),
  ('android', '1.0.0', 1, false, 'Initial release'),
  ('web', '1.0.0', 1, false, 'Initial release')
on conflict (platform, version) do nothing;

-- Insertar early_listeners de ejemplo
-- insert into public.early_listeners (user_id, supporter_tier, is_active)
-- values ('USER_UUID', 'founder', true);
