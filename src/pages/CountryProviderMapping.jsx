import { useEffect, useState } from "react";
import { panelApi } from "../lib/api.js";

// CHANGED: mapping global pays→fournisseur (voir memory/sebpay_integration.md) —
// PARTAGÉ par tous les événements (contrairement au reste de l'espace admin,
// aucun sélecteur d'événement sur cette page). Détermine, pour un événement en
// mode de paiement "Afrique" (voir page Période de vote), quel agrégateur
// traite chaque pays.
export default function CountryProviderMapping() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [savingCode, setSavingCode] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    panelApi("/country-provider-mapping")
      .then(setCountries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleProviderChange(country, provider) {
    setSavingCode(country.code);
    setError(null);
    setNotice(null);
    try {
      await panelApi(`/country-provider-mapping/${country.code}`, {
        method: "PUT",
        body: JSON.stringify({ countryName: country.name, prefix: country.prefix, provider }),
      });
      setCountries((prev) => prev.map((c) => (c.code === country.code ? { ...c, provider } : c)));
      setNotice(`${country.name} → ${provider === "fedapay" ? "FedaPay" : "SebPay"}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCode(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Mapping pays → fournisseur</h1>
      <p className="mb-6 text-sm text-slate-500">
        Config globale, partagée par tous les événements — détermine quel agrégateur (FedaPay ou SebPay) traite
        chaque pays pour les événements en mode de paiement "Afrique". Un pays sans réglage explicite reste sur
        FedaPay par défaut. La liste des pays vient directement de SebPay (leurs codes/noms officiels).
      </p>

      {notice && <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Chargement...</p>
      ) : countries.length === 0 ? (
        <p className="text-sm text-slate-400">
          Aucun pays reçu de SebPay — vérifiez que la clé API est bien whitelistée côté SebPay.
        </p>
      ) : (
        <div className="panel-card !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Pays</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Fournisseur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {countries.map((c) => (
                <tr key={c.code}>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{c.code}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={c.provider}
                      disabled={savingCode === c.code}
                      onChange={(e) => handleProviderChange(c, e.target.value)}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60"
                    >
                      <option value="fedapay">FedaPay</option>
                      <option value="sebpay">SebPay</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
