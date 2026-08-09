import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, AdminOnlyRoute } from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import VoteHistory from "./pages/VoteHistory.jsx";
import PendingVotes from "./pages/PendingVotes.jsx";
import Candidates from "./pages/Candidates.jsx";
import VotingPeriod from "./pages/VotingPeriod.jsx";
import Withdrawals from "./pages/Withdrawals.jsx";
import TicketSales from "./pages/TicketSales.jsx";
import TicketTypes from "./pages/TicketTypes.jsx";
import TicketClaims from "./pages/TicketClaims.jsx";
import Accounts from "./pages/Accounts.jsx";
import AuditLog from "./pages/AuditLog.jsx";
import LiveVoteScreen from "./pages/LiveVoteScreen.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/direct/:tenantKey" element={<LiveVoteScreen />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/changer-mot-de-passe" element={<ChangePassword />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/historique-votes" element={<VoteHistory />} />
          <Route path="/candidats" element={<Candidates />} />
          <Route path="/periode-de-vote" element={<VotingPeriod />} />
          <Route path="/retraits" element={<Withdrawals />} />
          <Route path="/ventes-tickets" element={<TicketSales />} />

          <Route element={<AdminOnlyRoute />}>
            <Route path="/verification-votes" element={<PendingVotes />} />
            <Route path="/types-de-tickets" element={<TicketTypes />} />
            <Route path="/reclamations" element={<TicketClaims />} />
            <Route path="/comptes" element={<Accounts />} />
            <Route path="/journal-audit" element={<AuditLog />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
