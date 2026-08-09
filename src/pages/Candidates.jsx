import { useEffect, useState } from "react";
import { tenantApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = {
  firstName: "",
  secondName: "",
  lastName: "",
  text: "",
  photoUrl: "",
  unitPrice: "",
  orderNumber: "",
};

export default function Candidates() {
  const { currentTenant, isAdmin } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null); // candidate object, or "new"
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingFictive, setEditingFictive] = useState(null); // candidate object
  const [fictiveInput, setFictiveInput] = useState("");
  const [savingFictive, setSavingFictive] = useState(false);

  function load() {
    setLoading(true);
    tenantApi(currentTenant, "/manager")
      .then((data) => setCandidates(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setError(null);
    setNotice(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant]);

  function openEdit(candidate) {
    setEditing(candidate);
    setForm({
      firstName: candidate.firstName || "",
      secondName: candidate.secondName || "",
      lastName: candidate.lastName || "",
      text: candidate.text || "",
      photoUrl: candidate.photoUrl || "",
      unitPrice: candidate.unitPrice ?? "",
      orderNumber: candidate.orderNumber ?? "",
    });
  }

  function openCreate() {
    setEditing("new");
    setForm(emptyForm);
  }

  function closeModal() {
    setEditing(null);
    setForm(emptyForm);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing === "new") {
        await tenantApi(currentTenant, "/manager", {
          method: "POST",
          body: JSON.stringify({
            ...form,
            unitPrice: form.unitPrice === "" ? undefined : Number(form.unitPrice),
            orderNumber: form.orderNumber === "" ? undefined : Number(form.orderNumber),
          }),
        });
        setNotice("Candidat créé.");
      } else {
        // PROMOTEUR : seuls photoUrl/text sont envoyés (le backend rejette le
        // reste de toute façon, mais autant ne pas prétendre pouvoir modifier
        // plus que ce qui est réellement permis).
        const body = isAdmin
          ? {
              ...form,
              unitPrice: form.unitPrice === "" ? undefined : Number(form.unitPrice),
              orderNumber: form.orderNumber === "" ? undefined : Number(form.orderNumber),
            }
          : { photoUrl: form.photoUrl, text: form.text };

        await tenantApi(currentTenant, `/manager/${editing._id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        setNotice("Candidat mis à jour.");
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openFictiveVotes(candidate) {
    setEditingFictive(candidate);
    setFictiveInput(String(candidate.fictiveVotes || 0));
  }

  async function handleSaveFictiveVotes(e) {
    e.preventDefault();
    const value = Number(fictiveInput);
    if (!Number.isInteger(value) || value < 0) {
      setError("Le nombre de votes fictifs doit être un entier positif.");
      return;
    }
    setSavingFictive(true);
    setError(null);
    try {
      await tenantApi(currentTenant, `/manager/${editingFictive._id}/fictive-votes`, {
        method: "PATCH",
        body: JSON.stringify({ fictiveVotes: value }),
      });
      setNotice("Votes fictifs mis à jour.");
      setEditingFictive(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingFictive(false);
    }
  }

  async function handleDelete(candidate) {
    if (!window.confirm(`Supprimer définitivement ${candidate.firstName} ${candidate.lastName} ?`)) return;
    try {
      await tenantApi(currentTenant, `/manager/${candidate._id}`, { method: "DELETE" });
      setNotice("Candidat supprimé.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Candidats</h1>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary">
            + Nouveau candidat
          </button>
        )}
      </div>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!isAdmin && (
        <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          En tant que promoteur, vous pouvez modifier la photo et la bio de chaque candidat, ainsi que ses votes fictifs.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Votes (réels / fictifs)</th>
                <th className="px-4 py-3">Prix/vote</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates
                .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))
                .map((c) => (
                  <tr key={c._id}>
                    <td className="px-4 py-3 text-slate-500">{c.orderNumber}</td>
                    <td className="px-4 py-3">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900">{c.totalVotes || 0}</span>
                      <span className="ml-1 text-xs text-slate-400">
                        ({c.realVotes || 0} réel{(c.realVotes || 0) > 1 ? "s" : ""} / {c.fictiveVotes || 0} fictif{(c.fictiveVotes || 0) > 1 ? "s" : ""})
                      </span>
                    </td>
                    <td className="px-4 py-3">{c.unitPrice} FCFA</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openFictiveVotes(c)}
                        className="mr-3 text-amber-600 hover:underline"
                      >
                        Votes fictifs
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="mr-3 text-brand-600 hover:underline"
                      >
                        Modifier
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(c)}
                          className="text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Aucun candidat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <p className="mb-4 text-lg font-semibold text-slate-900">
              {editing === "new" ? "Nouveau candidat" : "Modifier le candidat"}
            </p>
            <form onSubmit={handleSave} className="space-y-3">
              {isAdmin && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Prénom</label>
                    <input
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label">Nom</label>
                    <input
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="field-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="field-label">Second prénom (optionnel)</label>
                    <input
                      value={form.secondName}
                      onChange={(e) => setForm({ ...form, secondName: e.target.value })}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label">
                      Prix officiel par vote (FCFA) — celui vu par le public, hors frais de transaction
                    </label>
                    <input
                      type="number"
                      value={form.unitPrice}
                      onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label">N° d'ordre</label>
                    <input
                      type="number"
                      value={form.orderNumber}
                      onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                      className="field-input"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="field-label">URL de la photo</label>
                <input
                  value={form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  className="field-input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="field-label">Bio</label>
                <textarea
                  rows={4}
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  className="field-input"
                />
              </div>

              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingFictive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <p className="mb-1 text-lg font-semibold text-slate-900">Votes fictifs</p>
            <p className="mb-4 text-sm text-slate-500">
              {editingFictive.firstName} {editingFictive.lastName} — actuellement {editingFictive.realVotes || 0} vote(s) réel(s)
            </p>
            <form onSubmit={handleSaveFictiveVotes} className="space-y-3">
              <div>
                <label className="field-label">
                  Nombre de votes fictifs (valeur totale, pas un ajout)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={fictiveInput}
                  onChange={(e) => setFictiveInput(e.target.value)}
                  className="field-input"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Le total public affiché deviendra {Number(fictiveInput) + (editingFictive.realVotes || 0) || editingFictive.realVotes || 0} vote(s).
                </p>
              </div>

              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingFictive(null)} className="btn-secondary">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingFictive}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700 hover:shadow disabled:opacity-60"
                >
                  {savingFictive ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
