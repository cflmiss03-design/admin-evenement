export default function VoteHistory({ candidates }) {
  return (
    <div className="bg-white shadow-soft rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Historique des évolutions</h3>
      <ul className="space-y-2 text-sm text-gray-600">
        {candidates.slice(0, 5).map((c) => (
          <li key={c.id}>
            {c.name} : {c.totalVotes || 0} votes enregistrés
          </li>
        ))}
        {/* Tu peux ajouter une vraie timeline avec date */}
      </ul>
    </div>
  );
}
