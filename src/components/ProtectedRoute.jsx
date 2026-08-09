import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute() {
  const { loading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.mustChangePassword && location.pathname !== "/changer-mot-de-passe") {
    return <Navigate to="/changer-mot-de-passe" replace />;
  }

  return <Outlet />;
}

export function AdminOnlyRoute() {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">Accès réservé aux administrateurs</p>
          <p className="mt-2 text-sm text-slate-500">
            Votre compte PROMOTEUR n'a pas accès à cette section.
          </p>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
