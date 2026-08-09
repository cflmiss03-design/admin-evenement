import { useEffect, useState } from "react";
import { panelApi } from "../lib/api.js";
import { TENANTS } from "../lib/tenants.js";

const emptyForm = { email: "", nom: "", prenom: "", role: "promoteur", tenantKeys: [TENANTS[0].key] };

function tenantLabel(key) {
  return TENANTS.find((t) => t.key === key)?.label || key;
}

// Coche/décoche un tenant dans un tableau tenantKeys, en préservant l'ordre.
function toggleTenantKey(tenantKeys, key) {
  return tenantKeys.includes(key) ? tenantKeys.filter((k) => k !== key) : [...tenantKeys, key];
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [revealedCredential, setRevealedCredential] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  function load() {
    setLoading(true);
    panelApi("/users")
      .then(setAccounts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { email: form.email, nom: form.nom, prenom: form.prenom, role: form.role };
      if (form.role === "promoteur") {
        if (form.tenantKeys.length === 0) {
          setError("Sélectionnez au moins un événement pour un compte promoteur.");
          setSaving(false);
          return;
        }
        body.tenantKeys = form.tenantKeys;
      }
      const created = await panelApi("/users", { method: "POST", body: JSON.stringify(body) });
      setRevealedCredential({ email: created.email, tempPassword: created.tempPassword });
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openEdit(account) {
    setEditingAccount(account);
    setEditForm({
      email: account.email,
      nom: account.nom,
      prenom: account.prenom,
      role: account.role,
      tenantKeys: account.tenantKeys || [],
    });
    setEditError(null);
  }

  async function handleEdit(e) {
    e.preventDefault();
    setEditSaving(true);
    setEditError(null);
    try {
      const body = { email: editForm.email, nom: editForm.nom, prenom: editForm.prenom, role: editForm.role };
      if (editForm.role === "promoteur") {
        if (editForm.tenantKeys.length === 0) {
          setEditError("Sélectionnez au moins un événement pour un compte promoteur.");
          setEditSaving(false);
          return;
        }
        body.tenantKeys = editForm.tenantKeys;
      }
      await panelApi(`/users/${editingAccount._id}`, { method: "PUT", body: JSON.stringify(body) });
      setEditingAccount(null);
      setEditForm(null);
      setNotice("Compte mis à jour.");
      load();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  }

  async function deleteAccount(account) {
    if (!window.confirm(`Supprimer définitivement le compte de ${account.prenom} ${account.nom} (${account.email}) ? Cette action est irréversible.`)) return;
    try {
      await panelApi(`/users/${account._id}`, { method: "DELETE" });
      setNotice("Compte supprimé.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(account) {
    try {
      await panelApi(`/users/${account._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !account.isActive }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPassword(account) {
    if (!window.confirm(`Générer un nouveau mot de passe temporaire pour ${account.email} ?`)) return;
    try {
      const result = await panelApi(`/users/${account._id}/reset-password`, { method: "POST" });
      setRevealedCredential(result);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Comptes</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Nouveau compte
        </button>
      </div>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {revealedCredential && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Mot de passe temporaire pour {revealedCredential.email} :</p>
          <p className="mt-1 font-mono text-base">{revealedCredential.tempPassword}</p>
          <p className="mt-1 text-xs">
            Communiquez-le à la personne concernée maintenant — il ne sera plus jamais affiché. Un changement de mot de passe sera exigé à sa première connexion.
          </p>
          <button onClick={() => setRevealedCredential(null)} className="mt-2 text-xs font-semibold underline">
            J'ai noté le mot de passe
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Événement(s)</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((a) => (
                <tr key={a._id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{a.prenom} {a.nom}</td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-slate-100 uppercase text-slate-600">{a.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.tenantKeys && a.tenantKeys.length > 0 ? a.tenantKeys.map(tenantLabel).join(", ") : "Tous"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {a.isActive ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(a)} className="mr-3 text-brand-600 hover:underline">Modifier</button>
                    <button onClick={() => resetPassword(a)} className="mr-3 text-brand-600 hover:underline">Réinitialiser mdp</button>
                    <button onClick={() => toggleActive(a)} className={`mr-3 ${a.isActive ? "text-red-600 hover:underline" : "text-emerald-600 hover:underline"}`}>
                      {a.isActive ? "Désactiver" : "Réactiver"}
                    </button>
                    <button onClick={() => deleteAccount(a)} className="text-red-700 hover:underline">Supprimer</button>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucun compte.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <p className="mb-4 text-lg font-semibold text-slate-900">Nouveau compte</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Prénom</label>
                  <input required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="field-input" />
                </div>
                <div>
                  <label className="field-label">Nom</label>
                  <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="field-input" />
                </div>
              </div>
              <div>
                <label className="field-label">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field-input" />
              </div>
              <div>
                <label className="field-label">Rôle</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="field-input">
                  <option value="promoteur">Promoteur</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {form.role === "promoteur" && (
                <div>
                  <label className="field-label">Événement(s)</label>
                  <div className="space-y-1.5 rounded-lg border border-slate-300 px-3 py-2">
                    {TENANTS.map((t) => (
                      <label key={t.key} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.tenantKeys.includes(t.key)}
                          onChange={() => setForm({ ...form, tenantKeys: toggleTenantKey(form.tenantKeys, t.key) })}
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Un promoteur peut être affecté à plusieurs événements.</p>
                </div>
              )}

              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Création..." : "Créer le compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingAccount && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <p className="mb-4 text-lg font-semibold text-slate-900">Modifier le compte</p>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Prénom</label>
                  <input required value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} className="field-input" />
                </div>
                <div>
                  <label className="field-label">Nom</label>
                  <input required value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} className="field-input" />
                </div>
              </div>
              <div>
                <label className="field-label">Email</label>
                <input required type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="field-input" />
              </div>
              <div>
                <label className="field-label">Rôle</label>
                <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="field-input">
                  <option value="promoteur">Promoteur</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {editForm.role === "promoteur" && (
                <div>
                  <label className="field-label">Événement(s)</label>
                  <div className="space-y-1.5 rounded-lg border border-slate-300 px-3 py-2">
                    {TENANTS.map((t) => (
                      <label key={t.key} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={editForm.tenantKeys.includes(t.key)}
                          onChange={() => setEditForm({ ...editForm, tenantKeys: toggleTenantKey(editForm.tenantKeys, t.key) })}
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Un promoteur peut être affecté à plusieurs événements.</p>
                </div>
              )}

              {editError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setEditingAccount(null); setEditForm(null); }} className="btn-secondary">Annuler</button>
                <button type="submit" disabled={editSaving} className="btn-primary">
                  {editSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
