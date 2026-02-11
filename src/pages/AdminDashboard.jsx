import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";
import StatsCards from "../components/StatsCards";
import CandidatesTable from "../components/CandidatesTable";
import WithdrawalForm from "../components/WithdrawalForm";
import FooterNotice from "../components/FooterNotice";

export default function AdminDashboard({ user }) {

  const { logout } = useAuth();

  const [candidates, setCandidates] = useState([]);
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    fetch("http://localhost:5000/api/manager")
      .then(res => res.json())
      .then(setCandidates)
      .catch(console.error);
  }, []);

  const totalVotes = candidates.reduce((a, c) => a + (c.totalVotes || 0), 0);
  const globalBalance = totalVotes * 100;
  const availableBalance = globalBalance - globalBalance * 0.05;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <div style={{
        flex: 1,
        marginLeft: 220,
        display: "flex",
        flexDirection: "column"
      }}>

        <Topbar user={user} />

        <div style={{
          padding: 20,
          flex: 1,
          backgroundColor: "#f9fafb"
        }}>

          {/* DASHBOARD */}
          {activePage === "dashboard" && (
            <>
              <StatsCards
                totalVotes={totalVotes}
                globalBalance={globalBalance}
                availableBalance={availableBalance}
              />

              <CandidatesTable
                candidates={candidates}
                refresh={() => window.location.reload()}
              />
            </>
          )}

          {/* RETRAITS */}
          {activePage === "withdrawals" && (
            <WithdrawalForm amount={availableBalance} />
          )}

        </div>

        <FooterNotice />

      </div>
    </div>
  );
}
