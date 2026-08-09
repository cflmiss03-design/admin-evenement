import { useEffect, useState } from "react";
import { tenantApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_LABELS = {
  en_attente: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  en_cours: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  validee: { label: "Validée", cls: "bg-blue-100 text-blue-700" },
  payee: { label: "Payée", cls: "bg-emerald-100 text-emerald-700" },
  rejetee: { label: "Rejetée", cls: "bg-red-100 text-red-700" },
  traitee: { label: "Traitée", cls: "bg-emerald-100 text-emerald-700" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, cls: "bg-slate-100 text-slate-600" };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export default function Withdrawals() {
  const { currentTenant, isAdmin, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: "", prenoms: "", moyen: "MTN Mobile Money", numero: "", montant: "" });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([
      tenantApi(currentTenant, "/withdrawals"),
      tenantApi(currentTenant, "/balances"),
    ])
      .then(([w, b]) => {
        setRequests(w);
        setBalance(b);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setNotice(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant]);

  async function handleRequest(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await tenantApi(currentTenant, "/withdrawals", {
        method: "POST",
        body: JSON.stringify({ ...form, montant: Number(form.montant) }),
      });
      setNotice("Demande de retrait envoyée.");
      setShowForm(false);
      setForm({ nom: "", prenoms: "", moyen: "MTN Mobile Money", numero: "", montant: "" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function review(id, status) {
    let rejectionReason = null;
    if (status === "rejetee") {
      rejectionReason = window.prompt("Raison du rejet (optionnel) :") || null;
    } else if (!window.confirm(`Confirmer le passage au statut "${STATUS_LABELS[status]?.label}" ?`)) {
      return;
    }
    setError(null);
    try {
      await tenantApi(currentTenant, `/withdrawals/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, rejectionReason }),
      });
      setNotice("Demande mise à jour.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Retraits</h1>
          {balance && (
            <p className="text-sm text-slate-500">
              Solde disponible :{" "}
              <span className="font-semibold text-slate-700">
                {new Intl.NumberFormat("fr-FR").format(balance.soldeDisponible || 0)} FCFA
              </span>
            </p>
          )}
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Demander un retrait
        </button>
      </div>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="table-shell">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3">Demandeur</th>
                <th className="px-4 py-3">Moyen</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Demandé le</th>
                <th className="px-4 py-3">Traité le</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{r.nom} {r.prenoms}</p>
                    <p className="text-xs text-slate-400">{r.numero}</p>
                    {r.requestedByEmail && <p className="text-xs text-slate-400">par {r.requestedByEmail}</p>}
                  </td>
                  <td className="px-4 py-3">{r.moyen}</td>
                  <td className="px-4 py-3 font-medium">{new Intl.NumberFormat("fr-FR").format(r.montant)} FCFA</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.reviewedAt
                      ? new Date(r.reviewedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
                      : "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {(r.status === "en_attente" || r.status === "en_cours") ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => review(r._id, "validee")} className="text-brand-600 hover:underline">Valider</button>
                          <button onClick={() => review(r._id, "rejetee")} className="text-red-600 hover:underline">Rejeter</button>
                        </div>
                      ) : r.status === "validee" ? (
                        <button onClick={() => review(r._id, "payee")} className="text-emerald-600 hover:underline">Marquer payée</button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {r.reviewedByEmail ? `par ${r.reviewedByEmail}` : "—"}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-slate-400">
                    Aucune demande de retrait.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <p className="mb-4 text-lg font-semibold text-slate-900">Demander un retrait</p>
            <form onSubmit={handleRequest} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Nom</label>
                  <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="field-input" />
                </div>
                <div>
                  <label className="field-label">Prénoms</label>
                  <input required value={form.prenoms} onChange={(e) => setForm({ ...form, prenoms: e.target.value })} className="field-input" />
                </div>
              </div>
              <div>
                <label className="field-label">Moyen (ex: MTN Mobile Money, Moov Money...)</label>
                <input required value={form.moyen} onChange={(e) => setForm({ ...form, moyen: e.target.value })} className="field-input" />
              </div>
              <div>
                <label className="field-label">Numéro</label>
                <input required value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className="field-input" />
              </div>
              <div>
                <label className="field-label">Montant (FCFA)</label>
                <input required type="number" min="1" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className="field-input" />
                {balance && (
                  <p className="mt-1 text-xs text-slate-400">
                    Disponible : {new Intl.NumberFormat("fr-FR").format(balance.soldeDisponible || 0)} FCFA
                  </p>
                )}
              </div>

              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Envoi..." : "Envoyer la demande"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!isAdmin && (
        <p className="mt-4 text-xs text-slate-400">
          Connecté en tant que {user?.email} — vos demandes sont validées par un administrateur avant tout paiement.
        </p>
      )}
    </div>
  );
}
