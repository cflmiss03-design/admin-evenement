import { useEffect, useState } from "react";
import { panelApi } from "../lib/api.js";
import { TENANTS } from "../lib/tenants.js";

const ACTION_LABELS = {
  login: "Connexion",
  change_password: "Changement de mot de passe",
  create_account: "Création de compte",
  activate_account: "Activation de compte",
  deactivate_account: "Désactivation de compte",
  reset_password: "Réinitialisation de mot de passe",
  create_candidate: "Création candidat",
  update_candidate: "Modification candidat",
  delete_candidate: "Suppression candidat",
  request_withdrawal: "Demande de retrait",
  review_withdrawal: "Validation/rejet de retrait",
  update_balance: "Ajustement de solde",
  update_settings: "Modification des réglages",
  resolve_ticket_claim: "Réclamation traitée",
  send_payout: "Envoi de paiement (FedaPay)",
};

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tenantKey, setTenantKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const limit = 30;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (tenantKey) params.set("tenantKey", tenantKey);
    panelApi(`/audit-log?${params.toString()}`)
      .then((data) => {
        setEntries(data.entries);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, tenantKey]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Journal d'audit</h1>
        <select
          value={tenantKey}
          onChange={(e) => { setTenantKey(e.target.value); setPage(1); }}
          className="field-input sm:w-auto"
        >
          <option value="">Tous les événements</option>
          {TENANTS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="table-shell">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Acteur</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Événement</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((e) => (
                  <tr key={e._id}>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {new Date(e.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">{e.actorEmail}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-slate-100 uppercase text-slate-600">{e.actorRole}</span>
                    </td>
                    <td className="px-4 py-3">{TENANTS.find((t) => t.key === e.tenantKey)?.label || "—"}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{ACTION_LABELS[e.actionType] || e.actionType}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-xs text-slate-400" title={JSON.stringify(e.details)}>
                      {e.details ? JSON.stringify(e.details) : "—"}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucune entrée.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>{total} entrée(s)</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-40">
                Précédent
              </button>
              <span>Page {page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-40">
                Suivant
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
