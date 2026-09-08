import { useEffect, useState } from "react";
import { tenantApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const STATUS_LABELS = {
  pending: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Payé", cls: "bg-emerald-100 text-emerald-700" },
  failed: { label: "Échoué", cls: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, cls: "bg-slate-100 text-slate-600" };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

function formatFCFA(n) {
  return new Intl.NumberFormat("fr-FR").format(n || 0) + " FCFA";
}

// CHANGED: fournisseur ayant traité le paiement (voir memory/sebpay_integration.md)
function ProviderBadge({ provider }) {
  if (!provider) return <span className="text-slate-300">—</span>;
  const isSebpay = provider === "sebpay";
  return (
    <span className={`badge ${isSebpay ? "bg-orange-100 text-orange-700" : "bg-sky-100 text-sky-700"}`}>
      {isSebpay ? "Transaction Internationale" : "Transaction locale"}
    </span>
  );
}

export default function Donations() {
  const { currentTenant } = useAuth();
  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const limit = 20;

  function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    if (q) params.set("q", q);

    tenantApi(currentTenant, `/manager/donations?${params.toString()}`)
      .then((res) => {
        setDonations(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant, page, status]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  const pages = Math.max(1, Math.ceil(total / limit));
  const totalPaid = donations.filter((d) => d.status === "paid").reduce((acc, d) => acc + (d.montant || 0), 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Dons</h1>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom ou email du donateur..."
            className="field-input w-64"
          />
          <button type="submit" className="btn-primary">
            Chercher
          </button>
        </form>
        <div className="flex gap-2">
          {["", "paid", "pending", "failed"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${status === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {s === "" ? "Tous" : STATUS_LABELS[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-slate-500">
            {total} don(s) · {formatFCFA(totalPaid)} sur cette page (statut payé)
          </p>
          <div className="table-shell">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3">Donateur</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Fournisseur</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((d) => (
                  <tr key={d._id}>
                    <td className="px-4 py-3">
                      {d.anonymous || !d.donor ? (
                        <p className="italic text-slate-400">Don anonyme</p>
                      ) : (
                        <>
                          <p className="font-medium text-slate-900">{d.donor?.nom || "—"}</p>
                          <p className="text-xs text-slate-400">{d.donor?.email || d.donor?.telephone || "—"}</p>
                        </>
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-600">
                      {d.message ? <span className="line-clamp-2">{d.message}</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatFCFA(d.montant)}</td>
                    <td className="px-4 py-3"><ProviderBadge provider={d.provider} /></td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{new Date(d.createdAt).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucun don.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>Page {page} / {pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-40">
                Précédent
              </button>
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
