import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { tenantApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

function formatFCFA(n) {
  return new Intl.NumberFormat("fr-FR").format(n || 0) + " FCFA";
}

export default function VoteHistory() {
  const { currentTenant } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastLoaded, setLastLoaded] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    tenantApi(currentTenant, "/manager/vote-history")
      .then((data) => {
        setEntries(data);
        setLastLoaded(new Date());
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  // Chargement initial + à chaque changement d'événement — pas de
  // rafraîchissement automatique ensuite (choix volontaire), l'admin/promoteur
  // clique "Rafraîchir" pour voir les derniers votes.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant]);

  const totalVotes = entries.reduce((acc, e) => acc + (e.votes || 0), 0);
  const totalAmount = entries.reduce((acc, e) => acc + (e.amount || 0), 0);

  const hourlyData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, () => 0);
    for (const e of entries) {
      const hour = new Date(e.createdAt).getHours();
      buckets[hour] += e.votes || 0;
    }
    return buckets;
  }, [entries]);

  const chartData = {
    labels: Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}h`),
    datasets: [
      {
        label: "Votes",
        data: hourlyData,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historique des votes</h1>
          <p className="text-sm text-slate-500">
            Aujourd'hui uniquement — se réinitialise chaque jour à minuit (heure du Bénin)
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn-primary">
          {loading ? "Chargement..." : "🔄 Rafraîchir"}
        </button>
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {lastLoaded && (
        <p className="mb-4 text-xs text-slate-400">
          Dernière mise à jour : {lastLoaded.toLocaleTimeString("fr-FR")}
        </p>
      )}

      {loading && entries.length === 0 ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="panel-card !p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Votes aujourd'hui</p>
              <p className="mt-1 text-xl font-bold text-brand-700">{new Intl.NumberFormat("fr-FR").format(totalVotes)}</p>
            </div>
            <div className="panel-card !p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Montant aujourd'hui</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">{formatFCFA(totalAmount)}</p>
            </div>
            <div className="panel-card !p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Transactions</p>
              <p className="mt-1 text-xl font-bold text-slate-700">{entries.length}</p>
            </div>
          </div>

          {entries.length > 0 && (
            <div className="panel-card mb-4">
              <p className="mb-4 text-sm font-semibold text-slate-900">Activité par heure</p>
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                }}
              />
            </div>
          )}

          <div className="table-shell">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3">Heure</th>
                  <th className="px-4 py-3">ID Client FedaPay</th>
                  <th className="px-4 py-3">Candidat</th>
                  <th className="px-4 py-3">Votes</th>
                  <th className="px-4 py-3">Montant payé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((e) => (
                  <tr key={e._id}>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(e.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">{e.fedapayCustomerId || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{e.candidateName || "—"}</td>
                    <td className="px-4 py-3">{e.votes}</td>
                    <td className="px-4 py-3 font-medium">{formatFCFA(e.amount)}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Aucun vote aujourd'hui pour l'instant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
