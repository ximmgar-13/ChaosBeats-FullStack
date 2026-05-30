import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Music, Users, Play, Heart } from "lucide-react";

interface Stats {
  songs: number;
  users: number;
  plays: number;
  favorites: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ songs: 0, users: 0, plays: 0, favorites: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("songs").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("songs").select("play_count").then((r) => {
        const total = (r.data || []).reduce((sum, s) => sum + (s.play_count || 0), 0);
        return total;
      }),
      supabase.from("favorites").select("*", { count: "exact", head: true }),
    ]).then(([songs, users, plays, favorites]) => {
      setStats({
        songs: songs.count ?? 0,
        users: users.count ?? 0,
        plays: plays as number,
        favorites: favorites.count ?? 0,
      });
    });
  }, []);

  const cards = [
    { label: "Canciones", value: stats.songs, icon: Music, color: "text-purple-400" },
    { label: "Usuarios", value: stats.users, icon: Users, color: "text-blue-400" },
    { label: "Reproducciones", value: stats.plays, icon: Play, color: "text-green-400" },
    { label: "Favoritos", value: stats.favorites, icon: Heart, color: "text-red-400" },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400">
            Bienvenido, {profile?.email} ({profile?.rol})
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">{card.label}</p>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="mt-2 text-3xl font-bold">{card.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
