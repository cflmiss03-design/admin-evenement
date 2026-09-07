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

function formatFCFA(n) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n || 0)) + " FCFA";
}

// Même barème que computeUrgentFee côté serveur (routes/withdrawals.js) —
// dupliqué ici uniquement pour l'aperçu instantané dans le formulaire ; le
// frais réellement appliqué est toujours recalculé et figé côté serveur.
function computeUrgentFeePreview(montant) {
  if (!montant || montant <= 0) return 0;
  if (montant <= 10000) return 2000;
  if (montant <= 50000) return 3000;
  return 5000;
}

// CHANGED: détail FedaPay/SebPay (voir memory/sebpay_integration.md) —
// visible ADMIN et PROMOTEUR. N'affiche jamais le montant réellement facturé
// au votant (majoré des frais) : uniquement le prix officiel, les frais réels
// SebPay et le net qui en résulte — la majoration reste une marge interne
// invisible ici comme partout ailleurs côté promoteur.
function ProviderBreakdown({ balance }) {
  // CHANGED: affiché dès que l'événement est en mode "Afrique", pas
  // seulement une fois qu'un premier vote international existe — l'admin/le
  // promoteur doit pouvoir suivre le détail (à 0 pour l'instant) dès
  // l'activation, pas seulement rétroactivement.
  if (balance.paymentType !== "afrique") return null;

  return (
    <div className="panel-card mb-6">
      <p className="mb-1 text-sm font-semibold text-slate-900">Répartition Transaction locale / Transaction Internationale</p>
      <p className="mb-4 text-xs text-slate-500">
        Pour les transactions internationales, le montant compté est le prix officiel moins les frais réels de
        l'agrégateur (calculés au moment de chaque paiement) — jamais le montant majoré facturé au votant.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Votes Transaction locale</p>
          <p className="mt-1 text-lg font-bold text-sky-700">{balance.votesFedapay || 0}</p>
          <p className="text-xs text-slate-500">{formatFCFA(balance.revenueFedapay)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Votes Transaction Internationale (net)</p>
          <p className="mt-1 text-lg font-bold text-orange-700">{balance.votesSebpay || 0}</p>
          <p className="text-xs text-slate-500">{formatFCFA(balance.revenueSebpayNet)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tickets Transaction locale</p>
          <p className="mt-1 text-lg font-bold text-sky-700">{balance.ticketsFedapay || 0}</p>
          <p className="text-xs text-slate-500">{formatFCFA(balance.revenueFedapayTickets)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tickets Transaction Internationale (net)</p>
          <p className="mt-1 text-lg font-bold text-orange-700">{balance.ticketsSebpay || 0}</p>
          <p className="text-xs text-slate-500">{formatFCFA(balance.revenueSebpayTicketsNet)}</p>
        </div>
      </div>

      {balance.sebpayVotesByCountry?.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Votes Transaction Internationale par pays</p>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-1.5 pr-4">Pays</th>
                <th className="py-1.5 pr-4">Votes</th>
                <th className="py-1.5 pr-4">Frais</th>
                <th className="py-1.5 pr-4">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balance.sebpayVotesByCountry.map((row) => (
                <tr key={row.country}>
                  <td className="py-1.5 pr-4 font-medium text-slate-900">{row.country}</td>
                  <td className="py-1.5 pr-4">{row.votes}</td>
                  <td className="py-1.5 pr-4 text-slate-500">{formatFCFA(row.feeAmount)}</td>
                  <td className="py-1.5 pr-4 font-medium">{formatFCFA(row.netAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {balance.sebpayTicketsByCountry?.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tickets Transaction Internationale par pays</p>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-1.5 pr-4">Pays</th>
                <th className="py-1.5 pr-4">Tickets</th>
                <th className="py-1.5 pr-4">Frais</th>
                <th className="py-1.5 pr-4">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {balance.sebpayTicketsByCountry.map((row) => (
                <tr key={row.country}>
                  <td className="py-1.5 pr-4 font-medium text-slate-900">{row.country}</td>
                  <td className="py-1.5 pr-4">{row.count}</td>
                  <td className="py-1.5 pr-4 text-slate-500">{formatFCFA(row.feeAmount)}</td>
                  <td className="py-1.5 pr-4 font-medium">{formatFCFA(row.netAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Withdrawals() {
  const { currentTenant, isAdmin, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: "", prenoms: "", moyen: "MTN Mobile Money", numero: "", montant: "", urgent: false });
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
      setForm({ nom: "", prenoms: "", moyen: "MTN Mobile Money", numero: "", montant: "", urgent: false });
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

      {balance && <ProviderBreakdown balance={balance} />}

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
                  <td className="px-4 py-3">
                    <p className="font-medium">{new Intl.NumberFormat("fr-FR").format(r.montant)} FCFA</p>
                    {r.urgent && (
                      <p className="text-xs text-amber-600">+ {formatFCFA(r.frais)} frais urgent</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={r.status} />
                      {r.urgent && (
                        <span className="badge bg-amber-100 text-amber-700">⚡ URGENT</span>
                      )}
                    </div>
                  </td>
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

              <div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, urgent: !form.urgent })}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    form.urgent
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {form.urgent ? "⚡ Retrait urgent activé" : "⚡ Retrait urgent"}
                </button>
                {form.urgent && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    Frais de traitement urgent : <span className="font-semibold">{formatFCFA(computeUrgentFeePreview(Number(form.montant)))}</span> — s'ajoute
                    au montant demandé (prélevé sur votre solde disponible, en plus du montant reçu).
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
