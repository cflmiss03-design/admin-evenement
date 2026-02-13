import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import FooterNotice from "../components/FooterNotice";
import DashboardContent from "../components/dashboard/DashboardContent";

export default function AdminDashboard({ user }) {  
  const { logout } = useAuth();

  const [activePage, setActivePage] = useState("dashboard");
  const [candidates, setCandidates] = useState([]);
  const [balances, setBalances] = useState(null);

  // fetch candidats
  useEffect(() => {
    fetch("https://vague-patty-amp1-2d1cfa97.koyeb.app/api/manager")
      .then(res => res.json())
      .then(setCandidates)
      .catch(console.error);
  }, []);

  // fetch balances
  useEffect(() => {
    fetch("https://vague-patty-amp1-2d1cfa97.koyeb.app/api/balances")
      .then(res => res.json())
      .then(setBalances)
      .catch(console.error);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="flex-1 flex flex-col md:ml-[220px]">
        <Topbar user={user} />

        <div className="flex-1 p-5 bg-gray-100">
          <DashboardContent
            activePage={activePage}
            balances={balances}
            candidates={candidates}
            refresh={() => window.location.reload()}
          />
        </div>

        <FooterNotice />
      </div>
    </div>
  );
}
