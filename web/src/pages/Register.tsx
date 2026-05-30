import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Register() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [matricula, setMatricula] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const err = await signUp(email, password, matricula);
    if (err) setError(err);
    else {
      setSuccess("Registro exitoso. Revisa tu correo para confirmar la cuenta.");
      setTimeout(() => navigate("/login"), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Crear Cuenta</h1>
          <p className="mt-2 text-gray-400">Regístrate en Chaos Beats</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
        )}
        {success && (
          <div className="rounded-lg bg-green-500/10 p-3 text-sm text-green-400">{success}</div>
        )}

        <input
          type="email"
          placeholder="Correo electrónico"
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Matrícula (ID institucional)"
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>

        <p className="text-center text-sm text-gray-400">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-purple-400 hover:text-purple-300">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
