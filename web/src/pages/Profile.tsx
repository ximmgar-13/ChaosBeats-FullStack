import { useEffect, useState, useRef } from "react";
import { Layout } from "../components/Layout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Camera, Save, Key, User, Upload, Loader2 } from "lucide-react";
import type { Song, Playlist } from "../types/supabase";

export function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile]);

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

  const handleSaveProfile = async () => {
    setSaving(true);
    setMsg("");

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, avatar_url: avatarUrl })
      .eq("id", profile?.id);

    if (error) {
      setMsg("Error: " + error.message);
    } else {
      setMsg("Perfil actualizado");
      if (refreshProfile) refreshProfile();
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMsg("Error: Solo se permiten JPG, PNG o WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMsg("Error: La imagen debe ser menor a 2MB");
      return;
    }
    setUploading(true);
    setMsg("");
    const ext = file.name.split(".").pop();
    const filePath = `${profile?.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);
    if (uploadError) {
      setMsg("Error al subir: " + uploadError.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;
    setAvatarUrl(publicUrl);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile?.id);
    if (updateError) {
      setMsg("Error al guardar: " + updateError.message);
    } else {
      setMsg("Foto de perfil actualizada");
      if (refreshProfile) refreshProfile();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMsg("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSaving(true);
    setMsg("");

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMsg("Error: " + error.message);
    } else {
      setMsg("Contraseña actualizada");
      setNewPassword("");
    }
    setSaving(false);
  };

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="text-2xl font-bold">Mi Perfil</h1>

        {msg && (
          <div className={`rounded-lg border p-4 text-sm ${
            msg.startsWith("Error") ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-green-500/30 bg-green-500/10 text-green-400"
          }`}>
            {msg}
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-purple-400" />
            Información
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Email</p>
              <p className="font-medium">{profile?.email}</p>
            </div>
            <div>
              <p className="text-gray-400">Matrícula</p>
              <p className="font-medium">{profile?.matricula}</p>
            </div>
            <div>
              <p className="text-gray-400">Rol</p>
              <p className="font-medium capitalize">{profile?.rol}</p>
            </div>
            <div>
              <p className="text-gray-400">Miembro desde</p>
              <p className="font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-gray-400">Nombre para mostrar</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Tu nombre"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-gray-400">Foto de perfil</label>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700">
                  <Camera className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? "Subiendo..." : "Subir foto"}
              </button>
              {avatarUrl && (
                <button
                  onClick={() => {
                    setAvatarUrl("");
                    supabase.from("profiles").update({ avatar_url: null }).eq("id", profile?.id).then(() => {
                      if (refreshProfile) refreshProfile();
                      setMsg("Foto eliminada");
                    });
                  }}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5 text-purple-400" />
            Cambiar contraseña
          </h2>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Nueva contraseña (mín. 6 caracteres)"
          />
          <button
            onClick={handleChangePassword}
            disabled={saving || !newPassword}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            <Key className="h-4 w-4" />
            {saving ? "Cambiando..." : "Cambiar contraseña"}
          </button>
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
                <span className={`text-xs ${pl.is_public ? "text-green-400" : "text-gray-500"}`}>
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
