import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { Song, Playlist } from "../types/supabase";

export function Profile() {
  const { profile } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from("songs")
      .select("*")
      .eq("artist_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setSongs((data as Song[]) || []));

    supabase
      .from("playlists")
      .select("*")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPlaylists((data as Playlist[]) || []));
  }, [profile?.id]);

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="font-medium">{profile?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Matrícula</p>
              <p className="font-medium">{profile?.matricula}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Rol</p>
              <p className="font-medium capitalize">{profile?.rol}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Miembro desde</p>
              <p className="font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>
        </div>

        {profile?.rol !== "user" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Mis Canciones ({songs.length})</h2>
            <div className="space-y-2">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
                >
                  <div>
                    <p className="font-medium">{song.title}</p>
                    <p className="text-sm text-gray-400">{song.genre || "Sin género"}</p>
                  </div>
                  <span className="text-sm text-gray-500">{song.play_count} reproducciones</span>
                </div>
              ))}
              {songs.length === 0 && (
                <p className="text-sm text-gray-500">No has subido canciones aún.</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Mis Playlists ({playlists.length})</h2>
          <div className="space-y-2">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
              >
                <div>
                  <p className="font-medium">{pl.name}</p>
                  <p className="text-sm text-gray-400">{pl.song_count} canciones</p>
                </div>
                <span
                  className={`text-xs ${pl.is_public ? "text-green-400" : "text-gray-500"}`}
                >
                  {pl.is_public ? "Pública" : "Privada"}
                </span>
              </div>
            ))}
            {playlists.length === 0 && (
              <p className="text-sm text-gray-500">No tienes playlists aún.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
