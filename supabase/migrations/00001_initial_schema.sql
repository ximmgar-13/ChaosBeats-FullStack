-- ============================================================
-- CHAOS BEATS — Esquema Completo
-- Migration 00001: Tablas, RLS, Triggers, Funciones
-- ============================================================

-- 0. EXTENSIONES
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

-- ============================================================
-- 1. TABLA PROFILES (extiende auth.users — rol owner/admin/user)
-- ============================================================
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null,
  matricula   text        not null,
  username    text        unique,
  display_name text,
  avatar_url  text,
  bio         text,
  rol         text        not null default 'user' check (rol in ('owner','admin','user')),
  metadata    jsonb       not null default '{}'::jsonb,
  language    text        default 'es',
  is_premium  boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Agregar columnas faltantes si la tabla ya existía
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists language text default 'es';
alter table public.profiles add column if not exists is_premium boolean not null default false;

create unique index if not exists idx_profiles_matricula on public.profiles(matricula);
create index if not exists idx_profiles_rol on public.profiles(rol);
create index if not exists idx_profiles_username on public.profiles(username);

-- ============================================================
-- 2. TABLA SONGS
-- ============================================================
create table if not exists public.songs (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  artist_id     uuid        not null references public.profiles(id) on delete cascade,
  album         text,
  genre         text,
  duration_seconds int,
  audio_url     text        not null,
  cover_url     text,
  lyrics        text,
  is_explicit   boolean     default false,
  is_published  boolean     default true,
  play_count    bigint      default 0,
  download_count bigint     default 0,
  is_offline_available boolean default false,
  metadata      jsonb       not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Si la tabla ya existía (app móvil), agregar columnas faltantes
alter table public.songs add column if not exists is_published boolean default true;
alter table public.songs add column if not exists is_offline_available boolean default false;
alter table public.songs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.songs add column if not exists download_count bigint default 0;
alter table public.songs add column if not exists artist_id uuid;
alter table public.songs add column if not exists created_by uuid;

create index if not exists idx_songs_artist on public.songs(artist_id);
create index if not exists idx_songs_genre on public.songs(genre);
create index if not exists idx_songs_created on public.songs(created_at desc);
create index if not exists idx_songs_title_trgm on public.songs using gin (title gin_trgm_ops);
create index if not exists idx_songs_published on public.songs(is_published) where is_published = true;
create index if not exists idx_songs_offline on public.songs(is_offline_available) where is_offline_available = true;

-- ============================================================
-- 3. TABLA PLAYLISTS
-- ============================================================
create table if not exists public.playlists (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  description   text,
  cover_url     text,
  owner_id      uuid        not null references public.profiles(id) on delete cascade,
  is_public     boolean     default true,
  is_collaborative boolean  default false,
  song_count    int         default 0,
  total_duration_seconds int default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_playlists_owner on public.playlists(owner_id);
create index if not exists idx_playlists_public on public.playlists(is_public) where is_public = true;

-- ============================================================
-- 4. TABLA PLAYLIST_SONGS (relación M:N)
-- ============================================================
create table if not exists public.playlist_songs (
  id          uuid        primary key default gen_random_uuid(),
  playlist_id uuid        not null references public.playlists(id) on delete cascade,
  song_id     uuid        not null references public.songs(id) on delete cascade,
  position    int         not null,
  added_by    uuid        references public.profiles(id) on delete set null,
  added_at    timestamptz not null default now(),
  unique(playlist_id, song_id)
);

create index if not exists idx_playlist_songs_playlist on public.playlist_songs(playlist_id);

-- ============================================================
-- 5. TABLA FAVORITES
-- ============================================================
create table if not exists public.favorites (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  song_id    uuid        not null references public.songs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, song_id)
);

create index if not exists idx_favorites_user on public.favorites(user_id);
create index if not exists idx_favorites_song on public.favorites(song_id);

-- ============================================================
-- 6. TABLA DONATIONS
-- ============================================================
create table if not exists public.donations (
  id             uuid        primary key default gen_random_uuid(),
  donor_id       uuid        not null references public.profiles(id) on delete cascade,
  artist_id      uuid        not null references public.profiles(id) on delete cascade,
  amount         numeric(10,2) not null check (amount > 0),
  currency       text        default 'USD',
  message        text,
  is_anonymous   boolean     default false,
  payment_method text,
  payment_status text        default 'pending' check (payment_status in ('pending','completed','failed','refunded')),
  created_at     timestamptz not null default now()
);

-- Si la tabla ya existía (app móvil), agregar columnas faltantes
alter table public.donations add column if not exists donor_id uuid;
alter table public.donations add column if not exists artist_id uuid;

create index if not exists idx_donations_artist on public.donations(artist_id);
create index if not exists idx_donations_donor on public.donations(donor_id);
create index if not exists idx_donations_status on public.donations(payment_status);

-- ============================================================
-- 7. TABLA EARLY_LISTENERS
-- ============================================================
create table if not exists public.early_listeners (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references public.profiles(id) on delete cascade,
  supporter_tier    text        check (supporter_tier in ('beta_tester','founder','early_bird','angel')),
  access_granted_at timestamptz not null default now(),
  expires_at        timestamptz,
  is_active         boolean     default true,
  unique(user_id)
);

-- ============================================================
-- 8. TABLA COMMENTS
-- ============================================================
create table if not exists public.comments (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  song_id    uuid        not null references public.songs(id) on delete cascade,
  parent_id  uuid        references public.comments(id) on delete cascade,
  content    text        not null,
  is_edited  boolean     default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comments_song on public.comments(song_id);
create index if not exists idx_comments_user on public.comments(user_id);
create index if not exists idx_comments_parent on public.comments(parent_id);

-- ============================================================
-- 9. TABLA SUBSCRIPTIONS (membresías)
-- ============================================================
create table if not exists public.subscriptions (
  id                     uuid        primary key default gen_random_uuid(),
  user_id                uuid        not null references public.profiles(id) on delete cascade,
  plan_type              text        not null check (plan_type in ('free','early_bird','premium','lifetime','artist_pro')),
  status                 text        not null default 'active' check (status in ('active','canceled','past_due','expired','trialing')),
  stripe_customer_id     text,
  stripe_subscription_id text        unique,
  started_at             timestamptz default now(),
  expires_at             timestamptz,
  canceled_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_stripe on public.subscriptions(stripe_subscription_id);

-- ============================================================
-- 10. TABLA LISTEN_HISTORY
-- ============================================================
create table if not exists public.listen_history (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  song_id          uuid        not null references public.songs(id) on delete cascade,
  listened_at      timestamptz not null default now(),
  duration_seconds int,
  completed        boolean     default false,
  device_type      text,
  ip_address       inet
);

create index if not exists idx_listen_history_user on public.listen_history(user_id);
create index if not exists idx_listen_history_song on public.listen_history(song_id);
create index if not exists idx_listen_history_time on public.listen_history(listened_at desc);

-- ============================================================
-- 11. TABLA NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  title      text        not null,
  body       text,
  type       text        check (type in ('new_song','playlist_update','donation','system','comment','follow','like','subscription')),
  data       jsonb       default '{}'::jsonb,
  is_read    boolean     default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_unread on public.notifications(user_id) where is_read = false;

-- ============================================================
-- 12. TABLA USER_SETTINGS
-- ============================================================
create table if not exists public.user_settings (
  user_id                   uuid        primary key references public.profiles(id) on delete cascade,
  language                  text        default 'es',
  dark_mode                 boolean     default true,
  notifications_enabled     boolean     default true,
  push_notifications_enabled boolean    default true,
  email_notifications       boolean     default true,
  offline_auto_download     boolean     default false,
  quality_preference        text        default 'high' check (quality_preference in ('low','medium','high','lossless')),
  show_explicit_content     boolean     default true,
  autoplay                  boolean     default true,
  updated_at                timestamptz not null default now()
);

-- ============================================================
-- 13. TABLA APP_VERSIONS
-- ============================================================
create table if not exists public.app_versions (
  id            uuid        primary key default gen_random_uuid(),
  platform      text        not null check (platform in ('ios','android','web')),
  version       text        not null,
  build_number  int         not null,
  is_required   boolean     default false,
  release_notes text,
  download_url  text,
  created_at    timestamptz not null default now(),
  unique(platform, version)
);

-- ============================================================
-- 14. TABLA OFFLINE_TOKENS
-- ============================================================
create table if not exists public.offline_tokens (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  token      text        not null unique,
  device_id  text        not null,
  expires_at timestamptz not null,
  is_revoked boolean     default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_offline_tokens_user on public.offline_tokens(user_id);
create index if not exists idx_offline_tokens_token on public.offline_tokens(token);

-- ============================================================
-- 15. HABILITAR ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.songs           enable row level security;
alter table public.playlists       enable row level security;
alter table public.playlist_songs  enable row level security;
alter table public.favorites       enable row level security;
alter table public.donations       enable row level security;
alter table public.early_listeners enable row level security;
alter table public.comments        enable row level security;
alter table public.subscriptions   enable row level security;
alter table public.listen_history  enable row level security;
alter table public.notifications   enable row level security;
alter table public.user_settings   enable row level security;
alter table public.app_versions    enable row level security;
alter table public.offline_tokens  enable row level security;

-- ============================================================
-- 16. FUNCIÓN AUXILIAR: obtener rol del usuario autenticado
-- ============================================================
create or replace function public.get_current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid()
$$;

-- ============================================================
-- 17. POLÍTICAS RLS
-- ============================================================

-- 17a. PROFILES
drop policy if exists "owner_all_profiles" on public.profiles;
create policy "owner_all_profiles" on public.profiles
  for all using (get_current_user_role() = 'owner')
  with check (get_current_user_role() = 'owner');

drop policy if exists "admin_select_profiles" on public.profiles;
create policy "admin_select_profiles" on public.profiles
  for select using (get_current_user_role() = 'admin');

drop policy if exists "admin_insert_profiles" on public.profiles;
create policy "admin_insert_profiles" on public.profiles
  for insert with check (get_current_user_role() = 'admin');

drop policy if exists "admin_update_profiles" on public.profiles;
create policy "admin_update_profiles" on public.profiles
  for update using (get_current_user_role() = 'admin')
  with check (get_current_user_role() = 'admin' and rol != 'owner');

drop policy if exists "user_select_own_profile" on public.profiles;
create policy "user_select_own_profile" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "user_update_own_profile" on public.profiles;
create policy "user_update_own_profile" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and rol = (select rol from public.profiles where id = auth.uid()));

-- 17b. SONGS
drop policy if exists "songs_select_all_auth" on public.songs;
create policy "songs_select_all_auth" on public.songs
  for select using (
    is_published = true
    or exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin','owner'))
    or artist_id = auth.uid()
  );

drop policy if exists "songs_insert_admin_owner" on public.songs;
create policy "songs_insert_admin_owner" on public.songs
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin','owner'))
  );

drop policy if exists "songs_update_admin_owner" on public.songs;
create policy "songs_update_admin_owner" on public.songs
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin','owner'))
  );

drop policy if exists "songs_delete_admin_owner" on public.songs;
create policy "songs_delete_admin_owner" on public.songs
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin','owner'))
  );

-- 17c. PLAYLISTS
drop policy if exists "playlists_select" on public.playlists;
create policy "playlists_select" on public.playlists
  for select using (is_public = true or owner_id = auth.uid());

drop policy if exists "playlists_insert_own" on public.playlists;
create policy "playlists_insert_own" on public.playlists
  for insert with check (owner_id = auth.uid());

drop policy if exists "playlists_update_own" on public.playlists;
create policy "playlists_update_own" on public.playlists
  for update using (owner_id = auth.uid());

drop policy if exists "playlists_delete_own" on public.playlists;
create policy "playlists_delete_own" on public.playlists
  for delete using (owner_id = auth.uid());

-- 17d. PLAYLIST_SONGS
drop policy if exists "playlist_songs_select" on public.playlist_songs;
create policy "playlist_songs_select" on public.playlist_songs
  for select using (
    exists (select 1 from public.playlists where id = playlist_id and (is_public = true or owner_id = auth.uid()))
  );

drop policy if exists "playlist_songs_insert" on public.playlist_songs;
create policy "playlist_songs_insert" on public.playlist_songs
  for insert with check (
    exists (select 1 from public.playlists where id = playlist_id and owner_id = auth.uid())
  );

drop policy if exists "playlist_songs_delete" on public.playlist_songs;
create policy "playlist_songs_delete" on public.playlist_songs
  for delete using (
    exists (select 1 from public.playlists where id = playlist_id and owner_id = auth.uid())
  );

-- 17e. FAVORITES
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites
  for insert with check (user_id = auth.uid());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites
  for delete using (user_id = auth.uid());

-- 17f. DONATIONS
drop policy if exists "donations_select_own" on public.donations;
create policy "donations_select_own" on public.donations
  for select using (donor_id = auth.uid() or artist_id = auth.uid());

drop policy if exists "donations_insert" on public.donations;
create policy "donations_insert" on public.donations
  for insert with check (donor_id = auth.uid());

-- 17g. EARLY_LISTENERS
drop policy if exists "early_listeners_select" on public.early_listeners;
create policy "early_listeners_select" on public.early_listeners
  for select using (true);

-- 17h. COMMENTS
drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments
  for select using (true);

drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert" on public.comments
  for insert with check (user_id = auth.uid());

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments
  for update using (user_id = auth.uid());

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments
  for delete using (user_id = auth.uid());

-- 17i. SUBSCRIPTIONS
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (user_id = auth.uid());

drop policy if exists "subscriptions_insert" on public.subscriptions;
create policy "subscriptions_insert" on public.subscriptions
  for insert with check (user_id = auth.uid());

drop policy if exists "subscriptions_update_own" on public.subscriptions;
create policy "subscriptions_update_own" on public.subscriptions
  for update using (user_id = auth.uid());

-- 17j. LISTEN_HISTORY
drop policy if exists "listen_history_select_own" on public.listen_history;
create policy "listen_history_select_own" on public.listen_history
  for select using (user_id = auth.uid());

drop policy if exists "listen_history_insert" on public.listen_history;
create policy "listen_history_insert" on public.listen_history
  for insert with check (user_id = auth.uid());

-- 17k. NOTIFICATIONS
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());

-- 17l. USER_SETTINGS
drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings
  for select using (user_id = auth.uid());

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings
  for insert with check (user_id = auth.uid());

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings
  for update using (user_id = auth.uid());

-- 17m. APP_VERSIONS
drop policy if exists "app_versions_select" on public.app_versions;
create policy "app_versions_select" on public.app_versions
  for select using (true);

drop policy if exists "app_versions_insert_admin_owner" on public.app_versions;
create policy "app_versions_insert_admin_owner" on public.app_versions
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin','owner'))
  );

drop policy if exists "app_versions_update_admin_owner" on public.app_versions;
create policy "app_versions_update_admin_owner" on public.app_versions
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin','owner'))
  );

-- 17n. OFFLINE_TOKENS
drop policy if exists "offline_tokens_select_own" on public.offline_tokens;
create policy "offline_tokens_select_own" on public.offline_tokens
  for select using (user_id = auth.uid());

drop policy if exists "offline_tokens_insert" on public.offline_tokens;
create policy "offline_tokens_insert" on public.offline_tokens
  for insert with check (user_id = auth.uid());

drop policy if exists "offline_tokens_update_own" on public.offline_tokens;
create policy "offline_tokens_update_own" on public.offline_tokens
  for update using (user_id = auth.uid());

-- ============================================================
-- 18. FUNCTIONS & TRIGGERS
-- ============================================================

-- 18a. Auto-crear profile + settings al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, matricula, username, display_name, avatar_url, rol)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'matricula', new.id::text),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_user_meta_data ->> 'rol', 'user')
  );
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 18b. Auto-actualizar updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trigger_profiles_updated_at on public.profiles;
create trigger trigger_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

drop trigger if exists trigger_songs_updated_at on public.songs;
create trigger trigger_songs_updated_at
  before update on public.songs
  for each row execute function public.update_updated_at_column();

drop trigger if exists trigger_playlists_updated_at on public.playlists;
create trigger trigger_playlists_updated_at
  before update on public.playlists
  for each row execute function public.update_updated_at_column();

drop trigger if exists trigger_comments_updated_at on public.comments;
create trigger trigger_comments_updated_at
  before update on public.comments
  for each row execute function public.update_updated_at_column();

drop trigger if exists trigger_subscriptions_updated_at on public.subscriptions;
create trigger trigger_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at_column();

drop trigger if exists trigger_user_settings_updated_at on public.user_settings;
create trigger trigger_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.update_updated_at_column();

-- 18c. Incrementar play_count
create or replace function public.increment_play_count(song_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.songs
  set play_count = play_count + 1
  where id = song_id;
end;
$$;

-- 18d. Obtener trending songs
create or replace function public.get_trending_songs(limit_count int default 20)
returns setof public.songs
language sql
security definer
stable
as $$
  select *
  from public.songs
  where is_published = true
  order by play_count desc, created_at desc
  limit limit_count;
$$;

-- 18e. Alias para compatibilidad con app móvil
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
as $$
  select rol from public.profiles where id = auth.uid()
$$;

-- 18f. Función helper: listar perfiles (solo admin/owner)
create or replace function public.list_profiles()
returns setof public.profiles
language sql
security definer
stable
as $$
  select *
  from public.profiles
  where exists (
    select 1 from public.profiles where id = auth.uid() and rol in ('admin','owner')
  )
  order by created_at desc;
$$;

-- ============================================================
-- 19. STORAGE BUCKETS (archivos de audio, covers, avatares)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('audio', 'audio', false, 52428800, array['audio/mpeg','audio/wav','audio/flac','audio/aac','audio/ogg','audio/mp4']),
  ('covers', 'covers', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Storage RLS
drop policy if exists "audio_select" on storage.objects;
create policy "audio_select" on storage.objects
  for select using (bucket_id = 'audio' and auth.role() = 'authenticated');

drop policy if exists "audio_insert" on storage.objects;
create policy "audio_insert" on storage.objects
  for insert with check (
    bucket_id = 'audio'
    and auth.role() = 'authenticated'
    and exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin','owner'))
  );

drop policy if exists "audio_delete" on storage.objects;
create policy "audio_delete" on storage.objects
  for delete using (
    bucket_id = 'audio'
    and auth.role() = 'authenticated'
    and exists (select 1 from public.profiles where id = auth.uid() and rol in ('admin','owner'))
  );

drop policy if exists "covers_select" on storage.objects;
create policy "covers_select" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "covers_insert" on storage.objects;
create policy "covers_insert" on storage.objects
  for insert with check (bucket_id = 'covers' and auth.role() = 'authenticated');

drop policy if exists "covers_delete" on storage.objects;
create policy "covers_delete" on storage.objects
  for delete using (bucket_id = 'covers' and auth.role() = 'authenticated');

drop policy if exists "avatars_select" on storage.objects;
create policy "avatars_select" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- ============================================================
-- 20. TABLA USER_PUSH_TOKENS (para notificaciones push)
-- ============================================================
create table if not exists public.user_push_tokens (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  push_token text        not null,
  platform   text        check (platform in ('ios','android','web')),
  is_active  boolean     default true,
  created_at timestamptz not null default now(),
  unique(user_id, push_token)
);

alter table public.user_push_tokens enable row level security;

drop policy if exists "push_tokens_select_own" on public.user_push_tokens;
create policy "push_tokens_select_own" on public.user_push_tokens
  for select using (user_id = auth.uid());

drop policy if exists "push_tokens_insert" on public.user_push_tokens;
create policy "push_tokens_insert" on public.user_push_tokens
  for insert with check (user_id = auth.uid());

drop policy if exists "push_tokens_delete_own" on public.user_push_tokens;
create policy "push_tokens_delete_own" on public.user_push_tokens
  for delete using (user_id = auth.uid());

create index if not exists idx_push_tokens_user on public.user_push_tokens(user_id);
