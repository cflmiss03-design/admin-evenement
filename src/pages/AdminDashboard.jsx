import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import FooterNotice from "../components/FooterNotice";
import DashboardContent from "../components/dashboard/DashboardContent";
import { calculateDashboardStats } from "../utils/dashboardStats";

export default function AdminDashboard({ user }) {
  const { logout } = useAuth();

  const [activePage, setActivePage] = useState("dashboard");
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState(calculateDashboardStats(null));

  // fetch candidats
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/manager`)
      .then(res => res.json())
      .then(setCandidates)
      .catch(console.error);
  }, []);

  // fetch balances brutes → calcul frontend
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/balances`)
      .then(res => res.json())
      .then(rawBalance => setStats(calculateDashboardStats(rawBalance)))
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
            balances={stats}
            candidates={candidates}
            refresh={() => window.location.reload()}
          />
        </div>

        <FooterNotice />
      </div>
    </div>
  );
}
