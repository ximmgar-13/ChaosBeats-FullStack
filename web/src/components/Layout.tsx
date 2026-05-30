import { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Music, Users, LayoutDashboard, User, LogOut, Shield } from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/profile", label: "Perfil", icon: User },
];

const adminItems = [
  { path: "/admin/users", label: "Usuarios", icon: Users },
  { path: "/admin/songs", label: "Canciones", icon: Music },
];

export function Layout({ children }: { children: ReactNode }) {
  const { signOut, isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/50 p-4">
        <div className="mb-8 flex items-center gap-2">
          <Shield className="h-6 w-6 text-purple-500" />
          <span className="text-lg font-bold">Chaos Beats</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-purple-600/20 text-purple-400"
                    : "text-gray-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="my-3 border-t border-zinc-800" />
              <p className="mb-1 px-3 text-xs font-semibold uppercase text-gray-500">Admin</p>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-purple-600/20 text-purple-400"
                        : "text-gray-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="border-t border-zinc-800 pt-4">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-white">{profile?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{profile?.rol}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
