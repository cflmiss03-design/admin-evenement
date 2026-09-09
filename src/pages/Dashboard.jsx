import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { tenantApi } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatCard from "../components/StatCard.jsx";
import { getTenant } from "../lib/tenants.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function formatFCFA(n) {
  return new Intl.NumberFormat("fr-FR").format(n || 0) + " FCFA";
}
function formatNumber(n) {
  return new Intl.NumberFormat("fr-FR").format(n || 0);
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="mb-3 mt-8 flex items-center gap-2 first:mt-0">
      <span className="text-base">{icon}</span>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentTenant } = useAuth();
  // Un tenant "donation" (ex: amp-benin) n'a ni candidats ni votes/tickets :
  // toutes les cartes/graphiques qui en dépendent n'ont aucun sens et sont
  // remplacés ci-dessous par l'équivalent côté dons (voir lib/tenants.js).
  const isDonationTenant = getTenant(currentTenant)?.kind === "donation";
  const [balance, setBalance] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      tenantApi(currentTenant, "/balances"),
      // Sans objet pour un tenant "donation" — jamais de candidat, on
      // évite l'appel plutôt que d'afficher une liste vide pour rien.
      isDonationTenant ? Promise.resolve([]) : tenantApi(currentTenant, "/manager"),
      tenantApi(currentTenant, "/withdrawals"),
    ])
      .then(([bal, cands, withdrawals]) => {
        if (cancelled) return;
        setBalance(bal);
        setCandidates(cands);
        setPendingWithdrawals(withdrawals.filter((w) => w.status === "en_attente" || w.status === "en_cours").length);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant]);

  const top5 = [...candidates].sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0)).slice(0, 5);

  const rankingData = {
    labels: top5.map((c) => `${c.firstName} ${c.lastName}`),
    datasets: [
      {
        label: "Votes",
        data: top5.map((c) => c.totalVotes || 0),
        backgroundColor: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
        borderRadius: 8,
      },
    ],
  };

  const votesSplitData = {
    labels: ["Votes réels", "Votes fictifs"],
    datasets: [
      {
        data: [balance?.totalRealVotes || 0, balance?.totalFictiveVotes || 0],
        backgroundColor: ["#10b981", "#f59e0b"],
        borderWidth: 0,
      },
    ],
  };

  const revenueCompareData = {
    labels: ["Votes", "Tickets"],
    datasets: [
      {
        label: "Brut",
        data: [balance?.revenueFromRealVotes || 0, balance?.revenueFromTickets || 0],
        backgroundColor: "#93c5fd",
        borderRadius: 6,
      },
      {
        label: "Net (après commission)",
        data: [balance?.netVoteRevenue || 0, balance?.netTicketRevenue || 0],
        backgroundColor: "#10b981",
        borderRadius: 6,
      },
    ],
  };

  const hasVotesSplit = (balance?.totalRealVotes || 0) + (balance?.totalFictiveVotes || 0) > 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-sm text-slate-500">{getTenant(currentTenant)?.label}</p>
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          {isDonationTenant ? (
            <>
              <SectionHeader icon="💵" title="Revenu net (promoteur)" subtitle="Commission sur les dons collectés" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon="💰"
                  label="Revenu dons (brut)"
                  value={formatFCFA(balance?.revenueFromDonations)}
                  hint="Avant commission"
                  accent="brand"
                />
                <StatCard
                  icon="⚙️"
                  label="Main d'œuvre — dons"
                  value={`${balance?.donationLaborPercent ?? 0}%`}
                  hint="Commission sur le revenu des dons"
                  accent="amber"
                />
                <StatCard
                  icon="✅"
                  label="Revenu net — dons"
                  value={formatFCFA(balance?.netDonationRevenue)}
                  hint="Après commission"
                  accent="green"
                />
                <StatCard
                  icon="🏆"
                  label="Revenu net total (promoteur)"
                  value={formatFCFA(balance?.netRevenue)}
                  hint="Ce qui revient réellement au promoteur"
                  accent="green"
                  highlighted
                />
              </div>
            </>
          ) : (
            <>
              <SectionHeader icon="📊" title="Balance" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon="✅"
                  label="Votes réels"
                  value={formatNumber(balance?.totalRealVotes)}
                  hint="Votes payants validés"
                  accent="green"
                />
                <StatCard
                  icon="✏️"
                  label="Votes fictifs"
                  value={formatNumber(balance?.totalFictiveVotes)}
                  hint="Ajoutés manuellement, hors calculs financiers"
                  accent="amber"
                />
                <StatCard
                  icon="🗳️"
                  label="Total des votes"
                  value={formatNumber(balance?.totalVotes)}
                  hint="Réels + fictifs (nombre affiché publiquement)"
                  accent="brand"
                  highlighted
                />
                <StatCard
                  icon="💰"
                  label="Revenu (votes réels)"
                  value={formatFCFA(balance?.revenueFromRealVotes)}
                  hint="Votes réels × prix par candidat — jamais les fictifs"
                  accent="green"
                />
              </div>
            </>
          )}

          {!isDonationTenant && hasVotesSplit && (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="panel-card">
                <p className="mb-4 text-sm font-semibold text-slate-900">Répartition des votes</p>
                <div className="mx-auto max-w-[220px]">
                  <Doughnut
                    data={votesSplitData}
                    options={{
                      responsive: true,
                      plugins: { legend: { position: "bottom", labels: { boxWidth: 10, padding: 16 } } },
                    }}
                  />
                </div>
              </div>
              <div className="panel-card">
                <p className="mb-4 text-sm font-semibold text-slate-900">Revenu : brut vs net</p>
                <Bar
                  data={revenueCompareData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: "bottom", labels: { boxWidth: 10, padding: 16 } } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              </div>
            </div>
          )}

          {!isDonationTenant && (
            <>
              <SectionHeader
                icon="💵"
                title="Revenu net (promoteur)"
                subtitle="Votes et tickets ont chacun leur propre pourcentage de commission"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon="🎟️"
                  label="Revenu tickets (brut)"
                  value={formatFCFA(balance?.revenueFromTickets)}
                  hint="Billets payés uniquement"
                  accent="brand"
                />
                <StatCard
                  icon="🧮"
                  label="Revenu brut total"
                  value={formatFCFA(balance?.grossRevenue)}
                  hint="Votes réels + tickets, avant commission"
                  accent="brand"
                />
                <StatCard
                  icon="⚙️"
                  label="Main d'œuvre — votes"
                  value={`${balance?.voteLaborPercent ?? 0}%`}
                  hint="Commission sur le revenu des votes"
                  accent="amber"
                />
                <StatCard
                  icon="⚙️"
                  label="Main d'œuvre — tickets"
                  value={`${balance?.ticketLaborPercent ?? 0}%`}
                  hint="Commission sur le revenu des tickets"
                  accent="amber"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon="✅"
                  label="Revenu net — votes"
                  value={formatFCFA(balance?.netVoteRevenue)}
                  hint="Après commission votes"
                  accent="green"
                />
                <StatCard
                  icon="✅"
                  label="Revenu net — tickets"
                  value={formatFCFA(balance?.netTicketRevenue)}
                  hint="Après commission tickets"
                  accent="green"
                />
                <StatCard
                  icon="🏆"
                  label="Revenu net total (promoteur)"
                  value={formatFCFA(balance?.netRevenue)}
                  hint="Ce qui revient réellement au promoteur"
                  accent="green"
                  highlighted
                />
              </div>
            </>
          )}

          <SectionHeader icon="🏦" title="Solde & retraits" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="💳"
              label="Solde disponible"
              value={formatFCFA(balance?.soldeDisponible)}
              accent="green"
              highlighted
            />
            <StatCard
              icon="⏳"
              label="Demandes en cours"
              value={formatFCFA(balance?.demandeEnCours)}
              hint={pendingWithdrawals > 0 ? `${pendingWithdrawals} demande(s) en attente` : "Aucune demande en attente"}
              accent="amber"
              highlighted
            />
            {isDonationTenant ? (
              <StatCard
                icon="💝"
                label="Dons reçus"
                value={formatNumber((balance?.donationsFedapay || 0) + (balance?.donationsSebpay || 0))}
                accent="brand"
              />
            ) : (
              <StatCard icon="🎤" label="Candidats" value={candidates.length} accent="brand" />
            )}
            <StatCard icon="📤" label="Montant total retiré" value={formatFCFA(balance?.montantTransfere)} />
          </div>

          {!isDonationTenant && (
            <div className="panel-card mt-8">
              <p className="mb-4 text-sm font-semibold text-slate-900">Top 5 candidats par votes</p>
              {top5.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun candidat pour l'instant.</p>
              ) : (
                <Bar
                  data={rankingData}
                  options={{
                    indexAxis: "y",
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true } },
                  }}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
