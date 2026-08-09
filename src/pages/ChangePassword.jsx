import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ChangePassword() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const forced = !!user?.mustChangePassword;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Impossible de changer le mot de passe");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-slate-900 px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-sm animate-fade-in rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-2xl shadow-lg shadow-amber-600/30">
          🔒
        </div>
        <p className="text-center text-xl font-bold text-slate-900">
          {forced ? "Changement de mot de passe requis" : "Changer mon mot de passe"}
        </p>
        {forced && (
          <p className="mt-2 text-center text-sm text-slate-500">
            Pour la sécurité de votre compte, vous devez définir un nouveau mot de passe avant de continuer.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="field-label">Mot de passe actuel</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Nouveau mot de passe</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="field-input"
              placeholder="8 caractères minimum"
            />
          </div>
          <div>
            <label className="field-label">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="field-input"
            />
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
            {submitting ? "Enregistrement..." : "Valider"}
          </button>

          {forced && (
            <button
              type="button"
              onClick={logout}
              className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
            >
              Se déconnecter
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
