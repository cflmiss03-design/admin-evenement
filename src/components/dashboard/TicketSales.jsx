import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_BASE_URL;
const SECRET = import.meta.env.VITE_MANAGER_SECRET;

async function apiFetch(path) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "x-admin-secret": SECRET },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_BADGE = {
  pending: "bg-orange-100 text-orange-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};
const STATUS_LABEL = { pending: "en attente", paid: "payé", failed: "échoué" };

function SalesTab() {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    apiFetch(`/manager/ticket-sales?${params.toString()}`)
      .then((data) => {
        setSales(data.data);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, status, q]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    setQ(qInput.trim());
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {[
            { value: "", label: "Tous" },
            { value: "paid", label: "Payés" },
            { value: "pending", label: "En attente" },
            { value: "failed", label: "Échoués" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setPage(1);
                setStatus(opt.value);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                status === opt.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Rechercher nom, email, téléphone..."
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-56"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 text-white text-sm font-semibold px-4 py-1.5 hover:bg-blue-700"
          >
            Rechercher
          </button>
        </form>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Chargement...</p>
      ) : sales.length === 0 ? (
        <p className="text-gray-400 text-sm">Aucune vente pour ces critères.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Client</th>
                <th className="p-2 border">Contact</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border">Qté</th>
                <th className="p-2 border">Prix unit.</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Code candidate</th>
                <th className="p-2 border">Statut</th>
                <th className="p-2 border">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s._id}>
                  <td className="p-2 border font-medium">{s.buyerNom}</td>
                  <td className="p-2 border text-gray-500">
                    {s.buyerTelephone}
                    <br />
                    {s.buyerEmail}
                  </td>
                  <td className="p-2 border">{s.ticketTypeNom}</td>
                  <td className="p-2 border">{s.quantity}</td>
                  <td className="p-2 border">{s.unitPrice?.toLocaleString()} FCFA</td>
                  <td className="p-2 border font-semibold">{s.totalAmount?.toLocaleString()} FCFA</td>
                  <td className="p-2 border">{s.candidateCode || "—"}</td>
                  <td className="p-2 border">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[s.status] || "bg-gray-100"}`}>
                      {STATUS_LABEL[s.status] || s.status}
                    </span>
                  </td>
                  <td className="p-2 border text-gray-500 whitespace-nowrap">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-gray-500">
              {total} achat{total > 1 ? "s" : ""} — page {page}/{totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40"
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40"
              >
                Suivant →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CandidatesTab() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiFetch("/manager/ticket-sales/candidates")
      .then(setCandidates)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400 text-sm">Chargement...</p>;
  if (error) return <p className="text-red-500 text-sm">{error}</p>;

  const totalTickets = candidates.reduce((acc, c) => acc + (c.ticketsSold || 0), 0);
  const totalRevenue = candidates.reduce((acc, c) => acc + (c.revenue || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white shadow-soft rounded-2xl p-6">
          <h4 className="text-sm text-gray-500">Total billets vendus</h4>
          <p className="text-2xl font-bold text-blue-600">{totalTickets.toLocaleString("fr-FR")}</p>
        </div>
        <div className="bg-white shadow-soft rounded-2xl p-6">
          <h4 className="text-sm text-gray-500">Revenu total billets</h4>
          <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString("fr-FR")} FCFA</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Rang</th>
              <th className="p-2 border">Code</th>
              <th className="p-2 border">Candidate</th>
              <th className="p-2 border">Tickets vendus</th>
              <th className="p-2 border">Revenu généré</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => (
              <tr key={c._id}>
                <td className="p-2 border font-bold text-gray-400">#{i + 1}</td>
                <td className="p-2 border font-mono text-blue-700">{c.code}</td>
                <td className="p-2 border font-medium">{c.nom}</td>
                <td className="p-2 border">{c.ticketsSold}</td>
                <td className="p-2 border font-semibold">{c.revenue.toLocaleString()} FCFA</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TicketSales() {
  const [tab, setTab] = useState("sales");

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Ventes de Tickets</h2>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab("sales")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            tab === "sales" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Ventes / Clients
        </button>
        <button
          type="button"
          onClick={() => setTab("candidates")}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            tab === "candidates" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Classement Candidates
        </button>
      </div>

      {tab === "sales" ? <SalesTab /> : <CandidatesTab />}
    </div>
  );
}
