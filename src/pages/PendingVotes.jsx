import { useEffect, useState } from "react";
import { tenantApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatFCFA(n) {
  return new Intl.NumberFormat("fr-FR").format(n || 0) + " FCFA";
}
function formatDateTime(d) {
  return d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";
}

// CHANGED: fournisseur ayant traité le paiement (voir memory/sebpay_integration.md)
function ProviderBadge({ provider }) {
  const isSebpay = provider === "sebpay";
  return (
    <span className={`badge ${isSebpay ? "bg-orange-100 text-orange-700" : "bg-sky-100 text-sky-700"}`}>
      {isSebpay ? "SebPay" : "FedaPay"}
    </span>
  );
}

export default function PendingVotes() {
  const { currentTenant } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [rejectedTotal, setRejectedTotal] = useState(0);
  const [showRejected, setShowRejected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([
      tenantApi(currentTenant, "/manager/ticket-claims/settings"),
      tenantApi(currentTenant, "/manager/pending-votes"),
      tenantApi(currentTenant, "/manager/pending-votes/rejected"),
    ])
      .then(([settings, pendingList, rejectedData]) => {
        setEnabled(!!settings.manualVoteVerification);
        setPending(pendingList);
        setRejected(rejectedData.entries);
        setRejectedTotal(rejectedData.totalAmount);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setNotice(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant]);

  async function toggleEnabled(e) {
    const value = e.target.checked;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await tenantApi(currentTenant, "/manager/ticket-claims/settings", {
        method: "PUT",
        body: JSON.stringify({ manualVoteVerification: value }),
      });
      setEnabled(value);
      setNotice(value ? "Vérification manuelle activée." : "Vérification manuelle désactivée.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function decide(id, action) {
    if (action === "reject" && !window.confirm("Rejeter ce vote ? Le paiement reste encaissé mais le vote ne sera jamais compté.")) {
      return;
    }
    setActingId(id);
    setError(null);
    try {
      await tenantApi(currentTenant, `/manager/pending-votes/${id}/${action}`, { method: "PATCH" });
      setNotice(action === "approve" ? "Vote approuvé et comptabilisé." : "Vote rejeté.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Vérification manuelle des votes</h1>
        <p className="text-sm text-slate-500">Réservé à l'administrateur — uniquement les votes, jamais les tickets.</p>
      </div>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="panel-card mb-6">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={enabled} disabled={saving || loading} onChange={toggleEnabled} className="mt-1" />
          <span>
            <span className="block text-sm font-semibold text-slate-900">Activer la vérification manuelle des votes</span>
            <span className="mt-1 block text-xs text-slate-500">
              Une fois activé, chaque vote validé par FedaPay est mis en attente ci-dessous au lieu d'être compté
              automatiquement — il faut l'approuver pour qu'il apparaisse sur le site public et dans le solde du promoteur.
              Le paiement est toujours encaissé immédiatement, que le vote soit approuvé ou non.
            </span>
          </span>
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="table-shell">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">En attente de vérification ({pending.length})</p>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3">Candidat</th>
                  <th className="px-4 py-3">Fournisseur</th>
                  <th className="px-4 py-3">Votes</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">ID client FedaPay</th>
                  <th className="px-4 py-3">Payé le</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map((p) => (
                  <tr key={p._id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.candidateName || "—"}</td>
                    <td className="px-4 py-3"><ProviderBadge provider={p.provider} /></td>
                    <td className="px-4 py-3">{p.votes}</td>
                    <td className="px-4 py-3 font-medium">{formatFCFA(p.amount)}</td>
                    <td className="px-4 py-3 text-slate-500">{p.fedapayCustomerId ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(p.createdAt)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        disabled={actingId === p._id}
                        onClick={() => decide(p._id, "approve")}
                        className="mr-3 text-emerald-600 hover:underline disabled:opacity-50"
                      >
                        Approuver
                      </button>
                      <button
                        disabled={actingId === p._id}
                        onClick={() => decide(p._id, "reject")}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        Rejeter
                      </button>
                    </td>
                  </tr>
                ))}
                {pending.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Aucun vote en attente.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <button onClick={() => setShowRejected((v) => !v)} className="btn-secondary">
              {showRejected ? "Masquer" : "Voir"} les votes rejetés ({rejected.length} — {formatFCFA(rejectedTotal)} encaissés non comptés)
            </button>
          </div>

          {showRejected && (
            <div className="table-shell mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3">Candidat</th>
                    <th className="px-4 py-3">Votes</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Rejeté par</th>
                    <th className="px-4 py-3">Rejeté le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rejected.map((r) => (
                    <tr key={r._id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{r.candidateName || "—"}</td>
                      <td className="px-4 py-3">{r.votes}</td>
                      <td className="px-4 py-3 font-medium">{formatFCFA(r.amount)}</td>
                      <td className="px-4 py-3 text-slate-500">{r.reviewedByEmail || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(r.reviewedAt)}</td>
                    </tr>
                  ))}
                  {rejected.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucun vote rejeté.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
