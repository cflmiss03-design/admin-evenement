import { useEffect, useState } from "react";
import { tenantApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function TicketClaims() {
  const { currentTenant } = useAuth();
  const [claims, setClaims] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    tenantApi(currentTenant, `/manager/ticket-claims${filter ? `?status=${filter}` : ""}`)
      .then(setClaims)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setNotice(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant, filter]);

  async function resolve(id, status) {
    try {
      await tenantApi(currentTenant, `/manager/ticket-claims/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice("Réclamation mise à jour.");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const results = await tenantApi(currentTenant, `/manager/ticket-claims/search-tickets?q=${encodeURIComponent(query.trim())}`);
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Réclamations tickets</h1>

      <div className="panel-card !p-4 mb-6">
        <p className="mb-2 text-sm font-semibold text-slate-900">Rechercher un ticket</p>
        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ID transaction, téléphone, nom..."
            className="field-input flex-1"
          />
          <button type="submit" disabled={searching} className="btn-primary">
            {searching ? "..." : "Chercher"}
          </button>
        </form>
        {searchResults && (
          <div className="mt-3 space-y-2">
            {searchResults.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun ticket trouvé.</p>
            ) : (
              searchResults.map((t) => (
                <div key={t._id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-900">{t.displayName || t.buyer?.nom} — {t.numero}</p>
                  <p className="text-xs text-slate-500">{t.buyer?.telephone} · {t.status} · {t.fedapayTransactionId}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {["", "pending", "resolved"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${filter === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {s === "" ? "Toutes" : s === "pending" ? "En attente" : "Résolues"}
          </button>
        ))}
      </div>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <div key={c._id} className="panel-card !p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{c.nom}</p>
                  <p className="text-sm text-slate-500">
                    Contact : {c.contact}
                    {c.transactionOrTicketId && <> · Réf. : {c.transactionOrTicketId}</>}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(c.createdAt).toLocaleString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${c.status === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {c.status === "resolved" ? "Résolue" : "En attente"}
                  </span>
                  {c.status !== "resolved" ? (
                    <button onClick={() => resolve(c._id, "resolved")} className="text-sm text-brand-600 hover:underline">Marquer résolue</button>
                  ) : (
                    <button onClick={() => resolve(c._id, "pending")} className="text-sm text-slate-500 hover:underline">Rouvrir</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {claims.length === 0 && <p className="text-sm text-slate-400">Aucune réclamation.</p>}
        </div>
      )}
    </div>
  );
}
