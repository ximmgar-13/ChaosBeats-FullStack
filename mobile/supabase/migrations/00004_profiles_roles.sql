-- ============================================================
-- Profiles + Roles (Owner/Admin/User)
-- ============================================================

-- 1. TABLE profiles (vinculada a auth.users)
create table public.profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text not null,
  matricula text unique not null,
  rol       text not null default 'user' check (rol in ('owner', 'admin', 'user')),
  metadata  jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Migrar datos existentes de users a profiles (si hay)
insert into public.profiles (id, email, matricula, rol)
select
  id,
  coalesce(email, ''),
  coalesce(username, id::text),
  case when is_premium then 'admin' else 'user' end
from public.users
on conflict (id) do nothing;

-- 3. Agregar created_by a songs
alter table public.songs add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- 4. Actualizar trigger on signup para crear profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, matricula, rol)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'matricula', new.id::text),
    'user'
  );
  insert into public.users (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

-- 5. RLS en profiles
alter table public.profiles enable row level security;

-- Owner tiene acceso total
create policy "profiles_owner_all" on public.profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and rol = 'owner')
  );

-- Admin puede ver todos y editar usuarios (no owners)
create policy "profiles_admin_select" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin')
  );

create policy "profiles_admin_update" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin')
  );

-- User solo ve su propio perfil
create policy "profiles_user_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_user_update_own" on public.profiles
  for update using (id = auth.uid());

-- 6. RLS actualizadas para songs con roles
drop policy if exists "songs_select_published" on public.songs;
drop policy if exists "songs_insert_own" on public.songs;
drop policy if exists "songs_update_own" on public.songs;
drop policy if exists "songs_delete_own" on public.songs;

-- Todos los autenticados pueden LEER canciones publicadas
create policy "songs_select_all_auth" on public.songs
  for select using (
    status = 'published'
    or exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin', 'owner'))
    or artist_id = auth.uid()
  );

-- Admin y Owner pueden INSERTAR canciones
create policy "songs_insert_admin_owner" on public.songs
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin', 'owner'))
  );

-- Admin y Owner pueden EDITAR cualquier canción
create policy "songs_update_admin_owner" on public.songs
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin', 'owner'))
  );

-- Admin y Owner pueden ELIMINAR cualquier canción
create policy "songs_delete_admin_owner" on public.songs
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin', 'owner'))
  );

-- 7. Función helper: obtener el rol del usuario actual
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
as $$
  select rol from public.profiles where id = auth.uid();
$$;

-- 8. Función helper: listar usuarios (solo admin/owner)
create or replace function public.list_profiles()
returns setof public.profiles
language sql
security definer
stable
as $$
  select * from public.profiles
  where exists (
    select 1 from public.profiles where id = auth.uid() and rol in ('admin', 'owner')
  )
  order by created_at desc;
$$;
