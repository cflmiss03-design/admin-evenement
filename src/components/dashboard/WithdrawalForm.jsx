import { useState, useEffect } from "react";

export default function WithdrawalForm({ amount = 0 }) {
  const [form, setForm] = useState({
    nom: "",
    prenoms: "",
    moyen: "",
    numero: "",
    montant: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error"); // "error" | "success"
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const frais = form.montant
    ? Math.round(Number(form.montant) * 0.025)
    : 0;

  // Charger l'historique depuis MongoDB au montage
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/withdrawals`)
      .then(res => res.json())
      .then(data => {
        setHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const value = Number(form.montant);

    if (!form.nom || !form.prenoms || !form.moyen || !form.numero) {
      setMessageType("error");
      setMessage("Veuillez remplir tous les champs");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.numero)) {
      setMessageType("error");
      setMessage("Numéro invalide (10 chiffres uniquement)");
      return;
    }

    if (!value || value <= 0) {
      setMessageType("error");
      setMessage("Montant invalide");
      return;
    }

    if (value > amount) {
      setMessageType("error");
      setMessage("Le montant dépasse le solde disponible");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, montant: value, frais })
      });

      const data = await res.json();

      if (res.ok) {
        setMessageType("success");
        setMessage("Demande envoyée avec succès");

        // Ajouter en tête sans recharger toute la liste
        setHistory(prev => [data.request, ...prev]);

        setForm({ nom: "", prenoms: "", moyen: "", numero: "", montant: "" });
      } else {
        setMessageType("error");
        setMessage(data.message || "Erreur serveur");
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Erreur réseau");
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Demande de Retrait</h2>

      <p className="mb-4">
        Solde disponible :
        <span className="font-bold ml-2 text-green-600">
          {amount.toLocaleString()} F
        </span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">

        <input
          name="nom"
          placeholder="Nom"
          value={form.nom}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />

        <input
          name="prenoms"
          placeholder="Prénom(s)"
          value={form.prenoms}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />

        <select
          name="moyen"
          value={form.moyen}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        >
          <option value="">Moyen de paiement</option>
          <option>MTN</option>
          <option>Moov</option>
          <option>Celtiis</option>
          <option>Carte</option>
          <option>Bestcash</option>
        </select>

        <input
          name="numero"
          placeholder="Numéro (10 chiffres)"
          value={form.numero}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />

        <input
          type="number"
          name="montant"
          placeholder="Montant"
          value={form.montant}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />

        {form.montant && (
          <div className="bg-orange-100 text-orange-700 p-2 rounded-lg text-sm">
            Frais de transaction : {frais.toLocaleString()} F (2.5%)
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded-lg"
        >
          Demander le retrait
        </button>
      </form>

      {message && (
        <p className={`mt-3 text-sm font-medium ${messageType === "success" ? "text-green-600" : "text-red-500"}`}>
          {message}
        </p>
      )}

      {/* Historique persistant depuis MongoDB */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Historique des demandes</h3>

        {loadingHistory ? (
          <p className="text-sm text-gray-400">Chargement...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune demande enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Nom</th>
                  <th className="p-2 border">Montant</th>
                  <th className="p-2 border">Frais</th>
                  <th className="p-2 border">Moyen</th>
                  <th className="p-2 border">Statut</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h._id}>
                    <td className="p-2 border whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleString("fr-FR")}
                    </td>
                    <td className="p-2 border">{h.nom} {h.prenoms}</td>
                    <td className="p-2 border">{(h.montant || 0).toLocaleString()} F</td>
                    <td className="p-2 border">{(h.frais || 0).toLocaleString()} F</td>
                    <td className="p-2 border">{h.moyen}</td>
                    <td className="p-2 border">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        h.status === "traitee"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {h.status === "traitee" ? "Traitée" : "En cours"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
