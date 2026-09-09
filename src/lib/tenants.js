// Registre des événements gérables depuis cet espace admin. Miroir côté
// frontend de server-votes/src/config/tenants.js — ajouter un nouvel
// événement nécessite de toute façon un changement côté backend, donc
// garder ce petit fichier synchronisé manuellement est suffisant pour
// l'instant (pas besoin d'un endpoint public "liste des tenants").
//
// `kind` : détermine quelles sections du menu (Layout.jsx) et quels blocs de
// réglages (VotingPeriod.jsx) sont pertinents pour ce tenant — "vote"
// (défaut implicite si absent) affiche tout comme avant ; "donation" masque
// tout ce qui concerne votes/candidats/tickets, qui n'a aucun sens pour une
// collecte de dons (ex: amp-benin, dont le site public n'est même pas un de
// nos frontends).
export const TENANTS = [
  { key: "missculture", label: "Miss Culture Bénin", apiPrefix: "/api", kind: "vote" },
  { key: "campusvoice", label: "Campus Voice", apiPrefix: "/api/campusvoice", kind: "vote" },
  { key: "hwendo-topmodel", label: "Hwendo — TOP Modèle Afrique", apiPrefix: "/api/hwendo-topmodel", kind: "vote" },
  { key: "hwendo-createur", label: "Hwendo — Jeune Créateur", apiPrefix: "/api/hwendo-createur", kind: "vote" },
  { key: "hwendo-missendo", label: "Hwendo — Miss Endo-Culture", apiPrefix: "/api/hwendo-missendo", kind: "vote" },
  { key: "gbevivi", label: "Miss Gbévivi Bénin", apiPrefix: "/api/gbevivi", kind: "vote" },
  { key: "gbevivi-theatre", label: "Gbévivi — Théâtre Culturel", apiPrefix: "/api/gbevivi-theatre", kind: "vote" },
  // Tenant technique (pas un événement de vote) : contenu partagé par tout
  // le site Hwendo, pour l'instant uniquement la page Actualité. Sélectionner
  // ce tenant puis aller sur "Actualités" dans le menu.
  { key: "hwendo-site", label: "Hwendo — Actualités (site)", apiPrefix: "/api/hwendo-site", kind: "vote" },
  // Collecte de dons pour l'ONG AMP Bénin — site public externe (ampbenin.org,
  // construit par l'ONG), seuls le backend et cet espace admin sont chez nous.
  { key: "amp-benin", label: "AMP Bénin — Dons", apiPrefix: "/api/amp-benin", kind: "donation" },
];

export function getTenant(key) {
  return TENANTS.find((t) => t.key === key) || null;
}

export function apiPrefixFor(key) {
  return getTenant(key)?.apiPrefix || "/api";
}
