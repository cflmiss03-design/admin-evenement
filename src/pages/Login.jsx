import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const from = location.state?.from?.pathname;
      if (user.mustChangePassword) {
        navigate("/changer-mot-de-passe", { replace: true });
      } else {
        navigate(from || "/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Connexion impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-slate-900 px-4">
      {/* Décor */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-sm animate-fade-in rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-2xl shadow-lg shadow-brand-600/30">
          🗳️
        </div>
        <p className="text-center text-2xl font-bold text-slate-900">Espace Admin</p>
        <p className="mt-1 text-center text-sm text-slate-500">Plateforme de vote</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="field-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label className="field-label">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
            {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
