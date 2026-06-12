import { Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      {/* Login Admin */}
      <Route path="/admin-missculture-bj" element={<AdminLogin />} />

      {/* Dashboard protégé */}
      <Route
        path="/admin-missculture-bj/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
