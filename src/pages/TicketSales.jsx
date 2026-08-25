import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from "chart.js";
import { tenantApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

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
  const isSebpay = provider === "sebpay";
  return (
    <span className={`badge ${isSebpay ? "bg-orange-100 text-orange-700" : "bg-sky-100 text-sky-700"}`}>
      {isSebpay ? "SebPay" : "FedaPay"}
    </span>
  );
}

export default function TicketSales() {
  const { currentTenant } = useAuth();
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [candidateStats, setCandidateStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const limit = 20;

  function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    if (q) params.set("q", q);

    Promise.all([
      tenantApi(currentTenant, `/manager/ticket-sales?${params.toString()}`),
      tenantApi(currentTenant, "/manager/ticket-sales/candidates"),
    ])
      .then(([salesRes, candRes]) => {
        setSales(salesRes.data);
        setTotal(salesRes.total);
        setCandidateStats(candRes);
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
  const totalRevenue = sales.filter((s) => s.status === "paid").reduce((acc, s) => acc + (s.totalAmount || 0), 0);

  const topByRevenue = [...candidateStats].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 6);
  const revenueChartData = {
    labels: topByRevenue.map((c) => (c.code ? `${c.code} — ${c.nom}` : c.nom)),
    datasets: [
      {
        label: "Revenu tickets",
        data: topByRevenue.map((c) => c.revenue || 0),
        backgroundColor: "#8b5cf6",
        borderRadius: 8,
      },
    ],
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Ventes de tickets</h1>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel-card">
          <p className="mb-3 text-sm font-semibold text-slate-900">Billets vendus par candidat</p>
          {candidateStats.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune donnée.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Candidat</th>
                    <th className="py-2 pr-4">Billets vendus</th>
                    <th className="py-2 pr-4">Revenu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidateStats.map((c) => (
                    <tr key={c._id}>
                      <td className="py-2 pr-4 font-medium text-slate-900">{c.code ? `${c.code} — ` : ""}{c.nom}</td>
                      <td className="py-2 pr-4">{c.ticketsSold}</td>
                      <td className="py-2 pr-4">{formatFCFA(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel-card">
          <p className="mb-3 text-sm font-semibold text-slate-900">Top 6 — revenu par candidat</p>
          {topByRevenue.length === 0 || topByRevenue.every((c) => !c.revenue) ? (
            <p className="text-sm text-slate-400">Aucune vente pour l'instant.</p>
          ) : (
            <Bar
              data={revenueChartData}
              options={{
                indexAxis: "y",
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } },
              }}
            />
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, email ou téléphone acheteur..."
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
            {total} vente(s) · {formatFCFA(totalRevenue)} sur cette page (statut payé)
          </p>
          <div className="table-shell">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3">Acheteur</th>
                  <th className="px-4 py-3">Type de ticket</th>
                  <th className="px-4 py-3">Candidat</th>
                  <th className="px-4 py-3">Qté</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Fournisseur</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s._id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{s.buyerNom}</p>
                      <p className="text-xs text-slate-400">{s.buyerTelephone || s.buyerEmail}</p>
                    </td>
                    <td className="px-4 py-3">{s.ticketTypeNom}</td>
                    <td className="px-4 py-3">{s.candidateCode || "—"}</td>
                    <td className="px-4 py-3">{s.quantity}</td>
                    <td className="px-4 py-3 font-medium">{formatFCFA(s.totalAmount)}</td>
                    <td className="px-4 py-3"><ProviderBadge provider={s.provider} /></td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{new Date(s.createdAt).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Aucune vente.</td></tr>
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
