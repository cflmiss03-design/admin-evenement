import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { TENANTS, getTenant } from "../lib/tenants.js";

// `kinds` : quels types de tenant (voir lib/tenants.js) voient cette section
// — un tenant "donation" (ex: amp-benin) n'a ni candidats, ni votes, ni
// tickets : ces sections n'ont aucun sens pour un promoteur qui n'en gère
// que la collecte de dons, donc masquées plutôt que juste vides/inutiles.
// `labelByKind` : libellé de remplacement pour un type donné (ex: la page
// "/periode-de-vote" reste utile à un tenant "donation" — elle contient
// aussi les réglages de dons — mais son nom n'a plus de sens tel quel).
const navItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: "📊", adminOnly: false, kinds: ["vote", "donation"] },
  { to: "/historique-votes", label: "Historique des votes", icon: "🕐", adminOnly: false, kinds: ["vote"] },
  { to: "/verification-votes", label: "Vérification des votes", icon: "🔍", adminOnly: true, kinds: ["vote"] },
  { to: "/candidats", label: "Candidats", icon: "🎤", adminOnly: false, kinds: ["vote"] },
  { to: "/resultats-officiels", label: "Résultats officiels", icon: "🏆", adminOnly: true, kinds: ["vote"] },
  {
    to: "/periode-de-vote",
    label: "Période de vote",
    labelByKind: { donation: "Réglages" },
    icon: "🗓️",
    adminOnly: false,
    kinds: ["vote", "donation"],
  },
  { to: "/retraits", label: "Retraits", icon: "💸", adminOnly: false, kinds: ["vote", "donation"] },
  { to: "/ventes-tickets", label: "Ventes de tickets", icon: "🧾", adminOnly: false, kinds: ["vote"] },
  { to: "/dons", label: "Dons", icon: "💝", adminOnly: false, kinds: ["donation"] },
  { to: "/actualites", label: "Actualités", icon: "📰", adminOnly: false, kinds: ["vote"] },
  { to: "/types-de-tickets", label: "Types de tickets", icon: "🎟️", adminOnly: true, kinds: ["vote"] },
  { to: "/reclamations", label: "Réclamations tickets", icon: "📮", adminOnly: true, kinds: ["vote"] },
  { to: "/comptes", label: "Comptes", icon: "👤", adminOnly: true, kinds: ["vote", "donation"] },
  { to: "/journal-audit", label: "Journal d'audit", icon: "🧾", adminOnly: true, kinds: ["vote", "donation"] },
  { to: "/mapping-pays", label: "Mapping pays (SebPay)", icon: "🌍", adminOnly: true, kinds: ["vote", "donation"] },
];

function linkClasses({ isActive }) {
  return [
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
    isActive
      ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/20"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

export default function Layout() {
  const { user, isAdmin, logout, currentTenant, setCurrentTenant, accessibleTenants } = useAuth();
  const tenant = getTenant(currentTenant);
  const tenantKind = tenant?.kind || "vote";
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Options du sélecteur d'événement : toutes pour un admin, uniquement les
  // événements assignés pour un promoteur (peut en avoir plusieurs à la fois).
  const tenantOptions = isAdmin ? TENANTS : TENANTS.filter((t) => accessibleTenants.includes(t.key));

  // Referme le tiroir mobile à chaque changement de page.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const currentNavItem = navItems.find((item) => item.to === location.pathname);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Fond sombre derrière le tiroir mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out",
          "lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-br from-brand-700 to-brand-600 px-5 py-6">
          <div>
            <p className="flex items-center gap-2 text-lg font-bold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-base">🗳️</span>
              Espace Admin
            </p>
            <p className="mt-1 text-xs text-brand-100">{tenantKind === "donation" ? "Plateforme de dons" : "Plateforme de vote"}</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Fermer le menu"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-slate-200 px-5 py-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Événement</p>
          {isAdmin || tenantOptions.length > 1 ? (
            <select
              value={currentTenant}
              onChange={(e) => setCurrentTenant(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {tenantOptions.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              {tenant?.label}
            </p>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems
            .filter((item) => (!item.adminOnly || isAdmin) && item.kinds.includes(tenantKind))
            .map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClasses}>
                <span className="text-base">{item.icon}</span>
                <span>{item.labelByKind?.[tenantKind] || item.label}</span>
              </NavLink>
            ))}
        </nav>

        {/* Sans objet pour une collecte de dons (pas de vote à projeter). */}
        {tenantKind !== "donation" && (
          <div className="border-t border-slate-200 px-5 py-3">
            <a
              href={`/direct/${currentTenant}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900"
            >
              <span className="text-base">🖥️</span>
              <span>Écran de vote en direct</span>
            </a>
            <p className="px-3 pb-1 text-[11px] text-slate-400">Page publique, à projeter — aucune connexion requise pour l'ouvrir.</p>
          </div>
        )}

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {(user?.prenom?.[0] || "?").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {user?.prenom} {user?.nom}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            {user?.role}
          </span>
          <button onClick={logout} className="btn-secondary mt-3 w-full">
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre mobile : bouton hamburger + titre de la page courante */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
            aria-label="Ouvrir le menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="truncate text-sm font-semibold text-slate-900">
            {currentNavItem ? `${currentNavItem.icon} ${currentNavItem.labelByKind?.[tenantKind] || currentNavItem.label}` : "Espace Admin"}
          </p>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 animate-fade-in sm:px-6 lg:px-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
