import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { Shield } from "lucide-react";
import type { Profile } from "../../types/supabase";

export function AdminUsers() {
  const { isOwner } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    const { data } = await supabase.rpc("list_profiles");
    setProfiles((data as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    if (!isOwner && newRole === "owner") return;
    const { error } = await supabase
      .from("profiles")
      .update({ rol: newRole })
      .eq("id", userId);
    if (!error) fetchProfiles();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-gray-400">Administra los perfiles y roles</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Matrícula</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Rol</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Creado</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-900/30">
                    <td className="px-4 py-3">{p.email}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.matricula}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.rol === "owner"
                            ? "bg-purple-500/20 text-purple-400"
                            : p.rol === "admin"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-zinc-500/20 text-zinc-400"
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {p.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={p.rol}
                          onChange={(e) => updateRole(p.id, e.target.value)}
                          className="rounded bg-zinc-800 px-2 py-1 text-xs text-white outline-none"
                          disabled={p.rol === "owner" && !isOwner}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          {isOwner && <option value="owner">owner</option>}
                        </select>
                        {isOwner && p.rol !== "owner" && (
                          <span className="text-xs text-gray-600">(no eliminar desde aquí)</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
