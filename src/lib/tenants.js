// Registre des événements gérables depuis cet espace admin. Miroir côté
// frontend de server-votes/src/config/tenants.js — ajouter un nouvel
// événement nécessite de toute façon un changement côté backend, donc
// garder ce petit fichier synchronisé manuellement est suffisant pour
// l'instant (pas besoin d'un endpoint public "liste des tenants").
export const TENANTS = [
  { key: "missculture", label: "Miss Culture Bénin", apiPrefix: "/api" },
  { key: "campusvoice", label: "Campus Voice", apiPrefix: "/api/campusvoice" },
  { key: "hwendo-topmodel", label: "Hwendo — TOP Modèle Afrique", apiPrefix: "/api/hwendo-topmodel" },
  { key: "hwendo-createur", label: "Hwendo — Jeune Créateur", apiPrefix: "/api/hwendo-createur" },
  { key: "hwendo-missendo", label: "Hwendo — Miss Endo-Culture", apiPrefix: "/api/hwendo-missendo" },
  { key: "gbevivi", label: "Miss Gbévivi Bénin", apiPrefix: "/api/gbevivi" },
  { key: "gbevivi-theatre", label: "Gbévivi — Théâtre Culturel", apiPrefix: "/api/gbevivi-theatre" },
  // Tenant technique (pas un événement de vote) : contenu partagé par tout
  // le site Hwendo, pour l'instant uniquement la page Actualité. Sélectionner
  // ce tenant puis aller sur "Actualités" dans le menu.
  { key: "hwendo-site", label: "Hwendo — Actualités (site)", apiPrefix: "/api/hwendo-site" },
  // Collecte de dons pour l'ONG AMP Bénin — site public externe (ampbenin.org,
  // construit par l'ONG), seuls le backend et cet espace admin sont chez nous.
  { key: "amp-benin", label: "AMP Bénin — Dons", apiPrefix: "/api/amp-benin" },
];

export function getTenant(key) {
  return TENANTS.find((t) => t.key === key) || null;
}

export function apiPrefixFor(key) {
  return getTenant(key)?.apiPrefix || "/api";
}
