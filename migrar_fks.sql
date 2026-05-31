-- ============================================================
-- MIGRAR FK: de public.users → public.profiles
-- Ejecutar en SUPABASE DASHBOARD → SQL Editor
-- ============================================================

-- 1. Eliminar FKs existentes que apuntan a public.users
ALTER TABLE public.playlists DROP CONSTRAINT IF EXISTS playlists_owner_id_fkey;
ALTER TABLE public.songs DROP CONSTRAINT IF EXISTS songs_artist_id_fkey;
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
ALTER TABLE public.playlist_songs DROP CONSTRAINT IF EXISTS playlist_songs_added_by_fkey;

-- 2. Agregar nuevas FKs apuntando a public.profiles
ALTER TABLE public.playlists
  ADD CONSTRAINT playlists_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.songs
  ADD CONSTRAINT songs_artist_id_fkey
  FOREIGN KEY (artist_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.favorites
  ADD CONSTRAINT favorites_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.playlist_songs
  ADD CONSTRAINT playlist_songs_added_by_fkey
  FOREIGN KEY (added_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
