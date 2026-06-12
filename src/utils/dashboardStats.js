/**
 * Calcule les statistiques du dashboard à partir des données brutes MongoDB.
 *
 * Règles métier :
 *   soldeCompte     = totalVotes × prixUnitaire          (TOUS les votes, pas votesReels)
 *   soldeDisponible = balance.soldeDisponible             (valeur stockée, jamais calculée)
 *   soldeGlobal     = soldeCompte − soldeDisponible       (fonds bloqués chez FedaPay)
 *
 * @param {object|null} rawBalance - Réponse brute de GET /api/balances
 * @returns {object} Stats complètes prêtes à l'affichage
 */
export function calculateDashboardStats(rawBalance) {
  const totalVotes       = rawBalance?.totalVotes       || 0;
  const voteSimule       = rawBalance?.voteSimule       || 0;
  const prixUnitaire     = rawBalance?.prixUnitaire     || 200;
  const autreFrais       = rawBalance?.autreFrais       || 0;
  const demandeTraitee   = rawBalance?.demandeTraitee   || 0;
  const montantTransfere = rawBalance?.montantTransfere || 0;
  const demandeEnCours   = Math.max(0, (rawBalance?.demandeEnCours || 0) - demandeTraitee - montantTransfere);
  const soldeDisponible  = Math.max(0, (rawBalance?.soldeDisponible || 0) - demandeEnCours - demandeTraitee - montantTransfere - autreFrais);

  const votesReels   = totalVotes - voteSimule;
  const soldeCompte  = votesReels * prixUnitaire;
  const soldeGlobal  = soldeCompte - soldeDisponible;

  return {
    totalVotes,
    voteSimule,
    votesReels,
    prixUnitaire,
    soldeCompte,
    soldeDisponible,
    soldeGlobal,
    autreFrais,
    demandeEnCours,
    demandeTraitee,
    montantTransfere,
  };
}
