import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth();

  if (loading) {
    // pendant que AuthContext se charge depuis localStorage
    return <div>Chargement...</div>;
  }

  if (!isAuth) {
    return <Navigate to="/admin-missculture-bj" replace />;
  }

  return children;
}
