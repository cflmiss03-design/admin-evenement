import { useState } from "react";
import { requestWithdrawal } from "../services/api";

export default function WithdrawalForm({ amount }) {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    paymentMethod: "MTN",
    phone: ""
  });

  function change(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();

    if (!/^\d{10}$/.test(form.phone)) {
      alert("Numéro invalide");
      return;
    }

    try {
      await requestWithdrawal({ ...form, amount });
      alert("✅ Demande envoyée avec succès !");
      setForm({ nom: "", prenom: "", paymentMethod: "MTN", phone: "" });
    } catch (err) {
      alert("❌ Une erreur est survenue. Réessayez.");
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        maxWidth: 400,
        margin: "20px auto",
        padding: 24,
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: "Arial, sans-serif"
      }}
    >
      <h2 style={{ textAlign: "center", color: "#1f2937" }}>Demande de Retrait</h2>

      <input
        name="nom"
        placeholder="Nom"
        value={form.nom}
        onChange={change}
        required
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          fontSize: 14,
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
      />

      <input
        name="prenom"
        placeholder="Prénom"
        value={form.prenom}
        onChange={change}
        required
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          fontSize: 14,
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
      />

      <select
        name="paymentMethod"
        value={form.paymentMethod}
        onChange={change}
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          fontSize: 14,
          backgroundColor: "#fff",
          outline: "none",
          cursor: "pointer",
        }}
      >
        <option>MTN</option>
        <option>Moov</option>
        <option>Celtiis</option>
        <option>Carte</option>
      </select>

      <input
        name="phone"
        placeholder="Numéro MoMo"
        maxLength={10}
        value={form.phone}
        onChange={change}
        required
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          fontSize: 14,
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
      />

      <button
        type="submit"
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          backgroundColor: "#2563eb",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
          border: "none",
          transition: "background-color 0.2s, transform 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#1d4ed8";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#2563eb";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Soumettre
      </button>
    </form>
  );
}
