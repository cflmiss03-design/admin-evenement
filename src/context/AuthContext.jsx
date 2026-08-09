import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { panelApi, getToken, setToken } from "../lib/api.js";
import { TENANTS } from "../lib/tenants.js";

const AuthContext = createContext(null);

const TENANT_STORAGE_KEY = "panel_selected_tenant";

// Renvoie les tenants réellement accessibles à ce compte : tous pour un
// admin, uniquement ceux listés dans tenantKeys pour un promoteur (peut en
// avoir plusieurs à la fois).
function accessibleTenantsFor(user) {
  if (!user) return [];
  if (user.role === "admin") return TENANTS.map((t) => t.key);
  return user.tenantKeys || [];
}

// Choisit quel tenant afficher par défaut : celui déjà en localStorage s'il
// reste accessible à ce compte, sinon le premier accessible.
function pickCurrentTenant(user, stored) {
  const accessible = accessibleTenantsFor(user);
  if (stored && accessible.includes(stored)) return stored;
  return accessible[0] || TENANTS[0].key;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTenant, setCurrentTenantState] = useState(
    localStorage.getItem(TENANT_STORAGE_KEY) || TENANTS[0].key
  );

  const refreshMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await panelApi("/auth/me");
      setUser(me);
      setCurrentTenantState(pickCurrentTenant(me, localStorage.getItem(TENANT_STORAGE_KEY)));
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  async function login(email, password) {
    const data = await panelApi("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    setCurrentTenant(pickCurrentTenant(data.user, localStorage.getItem(TENANT_STORAGE_KEY)));
    return data.user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  function setCurrentTenant(key) {
    setCurrentTenantState(key);
    localStorage.setItem(TENANT_STORAGE_KEY, key);
  }

  async function changePassword(currentPassword, newPassword) {
    await panelApi("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setUser((u) => (u ? { ...u, mustChangePassword: false } : u));
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isPromoteur: user?.role === "promoteur",
    currentTenant,
    accessibleTenants: accessibleTenantsFor(user),
    setCurrentTenant,
    login,
    logout,
    changePassword,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
