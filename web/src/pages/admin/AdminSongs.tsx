import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Trash2, Plus } from "lucide-react";
import type { Song } from "../../types/supabase";

export function AdminSongs() {
  const { profile } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [genre, setGenre] = useState("");

  const fetchSongs = async () => {
    const { data } = await supabase
      .from("songs")
      .select("*, artist:profiles!songs_artist_id_fkey(id, username, display_name, avatar_url)")
      .order("created_at", { ascending: false });
    setSongs((data as Song[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    const { error } = await supabase.from("songs").insert({
      title,
      audio_url: audioUrl,
      artist_id: profile.id,
      genre: genre || null,
    });
    if (!error) {
      setTitle("");
      setAudioUrl("");
      setGenre("");
      setShowForm(false);
      fetchSongs();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta canción?")) return;
    await supabase.from("songs").delete().eq("id", id);
    fetchSongs();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Canciones</h1>
            <p className="text-gray-400">Administra el catálogo de beats</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Cancelar" : "Nueva Canción"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <input
              type="text"
              placeholder="Título de la canción"
              className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="url"
              placeholder="URL del archivo de audio"
              className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Género (opcional)"
              className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium hover:bg-purple-700"
            >
              Guardar
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-2">
            {songs.map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
              >
                <div className="flex items-center gap-4">
                  {song.cover_url && (
                    <img
                      src={song.cover_url}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{song.title}</p>
                    <p className="text-sm text-gray-400">
                      {song.genre || "Sin género"} · {song.play_count} reproducciones
                      {song.is_published ? " · Publicada" : " · Oculta"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(song.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {songs.length === 0 && (
              <p className="py-8 text-center text-gray-500">
                No hay canciones todavía. ¡Crea la primera!
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
