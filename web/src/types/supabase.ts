export type ProfileRole = "owner" | "admin" | "user";

export interface Profile {
  id: string;
  email: string;
  matricula: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  rol: ProfileRole;
  banned?: boolean;
  metadata: Record<string, unknown>;
  language: string;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  title: string;
  artist_id: string;
  album?: string;
  genre?: string;
  duration_seconds?: number;
  audio_url: string;
  cover_url?: string;
  lyrics?: string;
  is_explicit: boolean;
  is_published: boolean;
  play_count: number;
  download_count: number;
  is_offline_available: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  artist?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  owner_id: string;
  is_public: boolean;
  is_collaborative: boolean;
  song_count: number;
  total_duration_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface Comments {
  id: string;
  user_id: string;
  song_id: string;
  parent_id?: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  started_at?: string;
  expires_at?: string;
  created_at: string;
}
