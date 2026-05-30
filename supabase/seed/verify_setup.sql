-- ============================================================
-- Script de Verificación: Comprobar que todo está configurado
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Verificar tablas existentes
select table_name, table_type
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- 2. Verificar políticas RLS activas
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. Verificar funciones existentes
select
  routine_name,
  routine_type
from information_schema.routines
where specific_schema = 'public'
  and routine_name not like '%pg%'
  and routine_name not like '%_%'
order by routine_name;

-- 4. Verificar triggers
select
  trigger_name,
  event_manipulation,
  event_object_table
from information_schema.triggers
where trigger_schema = 'public'
order by trigger_name;

-- 5. Verificar buckets de storage
select id, name, public, file_size_limit
from storage.buckets
order by name;

-- 6. Contar registros existentes
select 'profiles' as tabla, count(*) as registros from public.profiles
union all
select 'songs', count(*) from public.songs
union all
select 'playlists', count(*) from public.playlists
union all
select 'favorites', count(*) from public.favorites
union all
select 'comments', count(*) from public.comments
union all
select 'notifications', count(*) from public.notifications
order by tabla;

-- 7. Verificar que el trigger de auth funciona
select
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
