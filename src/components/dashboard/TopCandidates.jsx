export default function TopCandidates({ candidates }) {
  // Top 4 candidats par totalVotes
  const top = [...candidates]
    .sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0))
    .slice(0, 4);

  return (
    <div className="bg-white shadow-soft rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Top 4 Candidats</h3>
      <ul className="space-y-2">
        {top.map((c) => (
          <li key={c.id} className="flex justify-between border-b border-gray-200 pb-2">
            <span>{c.name}</span>
            <span className="font-bold">{c.totalVotes || 0} votes</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
