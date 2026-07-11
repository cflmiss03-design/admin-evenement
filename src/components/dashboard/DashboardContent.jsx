import StatsCards from "./StatsCards";
import DashboardHome from "./DashboardHome";
import CandidatesTable from "./CandidatesTable";
import WithdrawalForm from "./WithdrawalForm";
import TicketSales from "./TicketSales";

export default function DashboardContent({ activePage, balances, candidates, refresh }) {
  switch (activePage) {
    case "dashboard":
      return <DashboardHome balances={balances} candidates={candidates} />;

    case "withdrawals":
      return <WithdrawalForm amount={balances?.soldeDisponible || 0} />;

    case "votes":
      return (
        <div>
          <h2 className="text-xl font-semibold mb-4">Candidats et Votes</h2>
          <CandidatesTable candidates={candidates} refresh={refresh} />
        </div>
      );

    case "tickets":
      return <TicketSales />;

    case "fedapay":
      return (
        <div>
          <h2 className="text-xl font-semibold mb-4">Fedapay</h2>
          <StatsCards
            totalVotes={balances?.totalVotes       || 0}
            voteSimule={balances?.voteSimule       || 0}
            soldeGlobal={balances?.soldeGlobal     || 0}
            soldeDisponible={balances?.soldeDisponible || 0}
            soldeCompte={balances?.soldeCompte     || 0}
            autreFrais={balances?.autreFrais       || 0}
            demandeEnCours={balances?.demandeEnCours  || 0}
            demandeTraitee={balances?.demandeTraitee  || 0}
            montantTransfere={balances?.montantTransfere || 0}
          />
        </div>
      );

    default:
      return <div className="text-red-500 p-4">Page non trouvée</div>;
  }
}
