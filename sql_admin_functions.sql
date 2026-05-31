-- ============================================================
-- EJECUTAR EN SUPABASE DASHBOARD -> SQL EDITOR
-- ============================================================

-- 1. Agregar columna banned a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned boolean DEFAULT false;

-- 2. RPC: listar perfiles con estado banned
CREATE OR REPLACE FUNCTION public.list_profiles()
RETURNS TABLE(id uuid, email text, matricula text, rol text, banned boolean, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.matricula, p.rol::text, p.banned, p.created_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- 3. RPC: banear / desbanear usuario
CREATE OR REPLACE FUNCTION public.toggle_ban(target_user_id uuid, should_ban boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles SET banned = should_ban WHERE id = target_user_id;
  RETURN FOUND;
END;
$$;

-- 4. RPC: eliminar usuario (borra profile + auth.users)
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
  RETURN true;
END;
$$;
