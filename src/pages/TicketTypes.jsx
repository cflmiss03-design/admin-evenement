import { useEffect, useState } from "react";
import { getToken } from "../lib/api.js";
import { apiPrefixFor } from "../lib/tenants.js";
import { useAuth } from "../context/AuthContext.jsx";

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const ORIGIN = RAW_BASE.replace(/\/api\/?$/, "");

// CHANGED: frais dédoublés par fournisseur (FedaPay/SebPay, voir memory/sebpay_integration.md).
const emptyForm = { nom: "", description: "", prix: "", fraisTransactionFedapay: "0", fraisTransactionSebpay: "0", zones: "[]", svg: null };

export default function TicketTypes() {
  const { currentTenant } = useAuth();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const base = `${ORIGIN}${apiPrefixFor(currentTenant)}/manager/ticket-types`;

  async function authedFetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) },
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((body && (body.message || body.error)) || `Erreur ${res.status}`);
    return body;
  }

  function load() {
    setLoading(true);
    authedFetch(base)
      .then(setTypes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setNotice(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant]);

  function openCreate() {
    setEditing("new");
    setForm(emptyForm);
  }
  function openEdit(t) {
    setEditing(t);
    setForm({
      nom: t.nom,
      description: t.description || "",
      prix: t.prix,
      // Repli sur l'ancien champ unique tant que ce type n'a pas encore été
      // reconfiguré (voir models/TicketType.js).
      fraisTransactionFedapay: t.fraisTransactionFedapay ?? t.fraisTransaction ?? "0",
      fraisTransactionSebpay: t.fraisTransactionSebpay ?? "0",
      zones: JSON.stringify(t.zones || [], null, 2),
      svg: null,
    });
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
      JSON.parse(form.zones || "[]"); // validation locale avant envoi
      const fd = new FormData();
      fd.append("nom", form.nom);
      fd.append("description", form.description);
      fd.append("prix", form.prix);
      fd.append("fraisTransactionFedapay", form.fraisTransactionFedapay);
      fd.append("fraisTransactionSebpay", form.fraisTransactionSebpay);
      fd.append("zones", form.zones);
      if (form.svg) fd.append("svg", form.svg);

      if (editing === "new") {
        if (!form.svg) throw new Error("Le fichier SVG est requis pour un nouveau type.");
        await authedFetch(base, { method: "POST", body: fd });
        setNotice("Type de ticket créé.");
      } else {
        await authedFetch(`${base}/${editing._id}`, { method: "PUT", body: fd });
        setNotice("Type de ticket mis à jour.");
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(t) {
    try {
      await authedFetch(`${base}/${t._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: t.statut === "actif" ? "inactif" : "actif" }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(t) {
    if (!window.confirm(`Supprimer définitivement le type "${t.nom}" ?`)) return;
    try {
      await authedFetch(`${base}/${t._id}`, { method: "DELETE" });
      setNotice("Type de ticket supprimé.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Types de tickets</h1>
        <button onClick={openCreate} className="btn-primary">
          + Nouveau type
        </button>
      </div>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => (
            <div key={t._id} className="panel-card !p-4">
              <img src={t.svgUrl} alt={t.nom} className="mb-3 h-32 w-full rounded-lg border border-slate-100 object-contain" />
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{t.nom}</p>
                <span className={`badge ${t.statut === "actif" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {t.statut}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{t.prix} FCFA</p>
              <div className="mt-3 flex gap-3 text-sm">
                <button onClick={() => openEdit(t)} className="text-brand-600 hover:underline">Modifier</button>
                <button onClick={() => toggleStatus(t)} className="text-amber-600 hover:underline">
                  {t.statut === "actif" ? "Désactiver" : "Activer"}
                </button>
                <button onClick={() => handleDelete(t)} className="text-red-600 hover:underline">Supprimer</button>
              </div>
            </div>
          ))}
          {types.length === 0 && <p className="text-sm text-slate-400">Aucun type de ticket.</p>}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <p className="mb-4 text-lg font-semibold text-slate-900">
              {editing === "new" ? "Nouveau type de ticket" : "Modifier le type de ticket"}
            </p>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="field-label">Nom</label>
                <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="field-input" />
              </div>
              <div>
                <label className="field-label">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="field-input" />
              </div>
              <div>
                <label className="field-label">Prix (FCFA)</label>
                <input required type="number" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} className="field-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Frais FedaPay (%)</label>
                  <input type="number" min="0" max="100" value={form.fraisTransactionFedapay} onChange={(e) => setForm({ ...form, fraisTransactionFedapay: e.target.value })} className="field-input" />
                </div>
                <div>
                  <label className="field-label">Frais SebPay (%)</label>
                  <input type="number" min="0" max="100" value={form.fraisTransactionSebpay} onChange={(e) => setForm({ ...form, fraisTransactionSebpay: e.target.value })} className="field-input" />
                </div>
              </div>
              <div>
                <label className="field-label">
                  Fichier SVG {editing === "new" ? "(requis)" : "(laisser vide pour ne pas changer)"}
                </label>
                <input type="file" accept=".svg,image/svg+xml" onChange={(e) => setForm({ ...form, svg: e.target.files[0] })} className="w-full text-sm" />
              </div>
              <div>
                <label className="field-label">
                  Zones de texte (JSON avancé — laisser <code>[]</code> si non utilisé)
                </label>
                <textarea rows={4} value={form.zones} onChange={(e) => setForm({ ...form, zones: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" />
              </div>

              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
