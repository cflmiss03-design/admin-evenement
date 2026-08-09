export default function StatCard({ label, value, hint, accent = "brand", highlighted = false, icon }) {
  const accents = {
    brand: "text-brand-700 bg-brand-50",
    green: "text-emerald-700 bg-emerald-50",
    amber: "text-amber-700 bg-amber-50",
    red: "text-red-700 bg-red-50",
  };
  // Carte "importante pour le promoteur" : fond teinté + bordure colorée
  // au lieu du blanc neutre, pour qu'elle saute aux yeux au milieu des
  // cartes plus techniques/internes (breakdown, %, etc.).
  const highlightContainers = {
    brand: "border-brand-300 bg-brand-50/60 ring-1 ring-brand-200",
    green: "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200",
    amber: "border-amber-300 bg-amber-50/60 ring-1 ring-amber-200",
    red: "border-red-300 bg-red-50/60 ring-1 ring-red-200",
  };
  const containerClasses = highlighted
    ? `rounded-2xl border-2 ${highlightContainers[accent]} p-5 shadow-md transition-transform duration-200 hover:-translate-y-0.5`
    : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";

  return (
    <div className={containerClasses}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        {icon && (
          <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm ${accents[accent]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-2 inline-block rounded-md px-2 py-1 text-2xl font-bold ${accents[accent]}`}>
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
