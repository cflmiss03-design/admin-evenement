import VotesGraph from "./VotesGraph";
import TopCandidates from "./TopCandidates";
import AccountBalance from "./AccountBalance";
import VoteHistory from "./VoteHistory";

export default function DashboardHome({ balances, candidates }) {
  return (
    <div className="space-y-6">
      {/* 1️⃣ Graphique d'évolution des votes */}
      <VotesGraph candidates={candidates} />

      {/* 2️⃣ Top 4 candidats */}
      <TopCandidates candidates={candidates} />

      {/* 3️⃣ Solde disponible et KPI financiers */}
      <AccountBalance balances={balances} />

      {/* 4️⃣ Historique des évolutions */}
      <VoteHistory candidates={candidates} />
    </div>
  );
}
