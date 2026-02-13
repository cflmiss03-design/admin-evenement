import { useState } from "react";

export default function WithdrawalForm({ amount = 0 }) {
  const [form, setForm] = useState({
    nom: "",
    prenoms: "",
    moyen: "",
    numero: "",
    montant: ""
  });

  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

  const frais = form.montant
    ? Math.round(Number(form.montant) * 0.025)
    : 0;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const value = Number(form.montant);

    if (!form.nom || !form.prenoms || !form.moyen || !form.numero) {
      setMessage("Veuillez remplir tous les champs");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.numero)) {
      setMessage("Numéro invalide (10 chiffres uniquement)");
      return;
    }

    if (!value || value <= 0) {
      setMessage("Montant invalide");
      return;
    }

    if (value > amount) {
      setMessage("Le montant dépasse le solde disponible");
      return;
    }

    try {
      const res = await fetch("https://vague-patty-amp1-2d1cfa97.koyeb.app/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          montant: value,
          frais
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Demande envoyée avec succès");

        setHistory([
          {
            ...form,
            montant: value,
            frais,
            date: new Date().toLocaleString()
          },
          ...history
        ]);

        setForm({
          nom: "",
          prenoms: "",
          moyen: "",
          numero: "",
          montant: ""
        });
      } else {
        setMessage(data.message || "Erreur serveur");
      }
    } catch (err) {
      console.error(err);
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
      <p className="mt-3 text-red-500 text-sm">{message}</p>
    )}

    {history.length > 0 && (
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Historique des demandes</h3>

        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Nom</th>
              <th className="p-2 border">Montant</th>
              <th className="p-2 border">Frais</th>
              <th className="p-2 border">Moyen</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td className="p-2 border">{h.date}</td>
                <td className="p-2 border">{h.nom}</td>
                <td className="p-2 border">{h.montant}</td>
                <td className="p-2 border">{h.frais}</td>
                <td className="p-2 border">{h.moyen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
  );
}
