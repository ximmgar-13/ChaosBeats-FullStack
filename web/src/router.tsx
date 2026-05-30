import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminSongs } from "./pages/admin/AdminSongs";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    ),
  },
  {
    path: "/profile",
    element: (
      <AuthGuard>
        <Profile />
      </AuthGuard>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <AuthGuard requireAdmin>
        <AdminUsers />
      </AuthGuard>
    ),
  },
  {
    path: "/admin/songs",
    element: (
      <AuthGuard requireAdmin>
        <AdminSongs />
      </AuthGuard>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
