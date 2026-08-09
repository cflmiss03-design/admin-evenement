// Registre des événements gérables depuis cet espace admin. Miroir côté
// frontend de server-votes/src/config/tenants.js — ajouter un nouvel
// événement nécessite de toute façon un changement côté backend, donc
// garder ce petit fichier synchronisé manuellement est suffisant pour
// l'instant (pas besoin d'un endpoint public "liste des tenants").
export const TENANTS = [
  { key: "missculture", label: "Miss Culture Bénin", apiPrefix: "/api" },
  { key: "campusvoice", label: "Campus Voice", apiPrefix: "/api/campusvoice" },
];

export function getTenant(key) {
  return TENANTS.find((t) => t.key === key) || null;
}

export function apiPrefixFor(key) {
  return getTenant(key)?.apiPrefix || "/api";
}
