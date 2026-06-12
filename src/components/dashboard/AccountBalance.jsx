export default function AccountBalance({ balances }) {
  const soldeDisponible = balances?.soldeDisponible ?? 0;
  const soldeGlobal     = balances?.soldeGlobal     ?? 0;

  return (
    <div className="bg-white shadow-soft rounded-2xl p-6 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold mb-2">Solde Disponible</h3>
        <p className="text-2xl font-bold text-green-600">
          {soldeDisponible.toLocaleString("fr-FR")} FCFA
        </p>
      </div>
      <div className="text-right">
        <h4 className="text-sm text-gray-500">Solde Global</h4>
        <p className="font-semibold">{soldeGlobal.toLocaleString("fr-FR")} FCFA</p>
      </div>
    </div>
  );
}
