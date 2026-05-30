import { supabase } from "./supabase";
import type { Song, Comment, Playlist, Donation, Profile } from "../types/supabase";

const EDGE_FUNCTIONS_URL = process.env.EXPO_PUBLIC_SUPABASE_URL + "/functions/v1";

export async function searchSongs(query: string, genre?: string, limit = 20) {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (genre) params.set("genre", genre);

  const { data } = await supabase.functions.invoke("search-songs", {
    method: "GET",
    queryParams: params,
  });
  return data as { data: Song[]; count: number };
}

export async function checkOfflineAccess(songIds: string[]) {
  const { data } = await supabase.functions.invoke("check-offline-access", {
    body: { song_ids: songIds },
  });
  return data as { offline_access: Record<string, boolean>; is_premium: boolean };
}

export async function checkAppVersion(platform: "ios" | "android", currentVersion: string) {
  const { data } = await supabase.functions.invoke("app-version-check", {
    body: { platform, current_version: currentVersion },
  });
  return data as {
    needs_update: boolean;
    force_update: boolean;
    latest_version: string;
    update_url: string;
    release_notes: string;
  };
}

export async function addToFavorites(songId: string) {
  const { data, error } = await supabase
    .from("favorites")
    .insert({ song_id: songId })
    .select()
    .single();
  return { data, error };
}

export async function removeFromFavorites(songId: string) {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("song_id", songId);
  return { error };
}

export async function getFavorites() {
  const { data, error } = await supabase
    .from("favorites")
    .select("*, song:songs(*)")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getComments(songId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, user:users!comments_user_id_fkey(id, username, display_name, avatar_url)")
    .eq("song_id", songId)
    .is("parent_id", null)
    .order("created_at", { ascending: false });
  return { data: data as (Comment & { user: { id: string; username: string } })[], error };
}

export async function addComment(songId: string, content: string, parentId?: string) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ song_id: songId, content, parent_id: parentId || null })
    .select()
    .single();
  return { data, error };
}

export async function getPlaylists() {
  const { data, error } = await supabase
    .from("playlists")
    .select("*, songs:playlist_songs(count)")
    .order("updated_at", { ascending: false });
  return { data, error };
}

export async function createDonation(amount: number, message?: string, isAnonymous = false) {
  const { data, error } = await supabase
    .from("donations")
    .insert({ amount, message, is_anonymous: isAnonymous })
    .select()
    .single();
  return { data, error };
}

export async function uploadAudioFile(uri: string, fileName: string) {
  const formData = new FormData();
  formData.append("file", { uri, name: fileName, type: "audio/mpeg" } as any);

  const { data, error } = await supabase.storage
    .from("audio")
    .upload(`public/${fileName}`, formData, {
      cacheControl: "3600",
      upsert: false,
    });
  return { data, error };
}

export async function getAudioUrl(path: string) {
  const { data } = supabase.storage.from("audio").getPublicUrl(path);
  return data.publicUrl;
}

// ============================================================
// ADMIN - Profiles & Roles
// ============================================================

export async function getMyProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .single();
  return { data: data as Profile | null, error };
}

export async function getMyRole() {
  const { data, error } = await supabase.rpc("get_my_role");
  return { role: data as string | null, error };
}

export async function listProfiles() {
  const { data, error } = await supabase.rpc("list_profiles");
  return { data: data as Profile[] | null, error };
}

export async function updateProfile(id: string, updates: Partial<Pick<Profile, "rol" | "matricula" | "metadata">>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data: data as Profile | null, error };
}

export async function createSongAsAdmin(song: {
  title: string;
  audio_url: string;
  artist_id: string;
  genre?: string;
  album?: string;
  cover_url?: string;
}) {
  const { data, error } = await supabase
    .from("songs")
    .insert({ ...song, created_by: (await supabase.auth.getUser()).data.user?.id })
    .select()
    .single();
  return { data, error };
}
