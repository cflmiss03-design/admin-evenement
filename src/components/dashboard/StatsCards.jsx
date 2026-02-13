import { useEffect, useState } from "react";
import {
  FaVoteYea,
  FaMoneyBillWave,
  FaWallet,
  FaUniversity,
  FaClock,
  FaCheckCircle
} from "react-icons/fa";

export default function StatsCards({
  totalVotes = 0,
  soldeGlobal = 0,
  soldeDisponible = 0,
  soldeCompte = 0,
  autreFrais = 0,
  demandeEnCours = 0,
  demandeTraitee = 0
}) {

  const [animatedValues, setAnimatedValues] = useState({
    totalVotes: 0,
    soldeGlobal: 0,
    soldeDisponible: 0,
    soldeCompte: 0,
    autreFrais: 0,
    demandeEnCours: 0,
    demandeTraitee: 0
  });

  useEffect(() => {
    const duration = 1000;
    const frameRate = 30;
    const totalFrames = Math.round((duration / 1000) * frameRate);

    const targets = {
      totalVotes,
      soldeGlobal,
      soldeDisponible,
      soldeCompte,
      autreFrais,
      demandeEnCours,
      demandeTraitee
    };

    let frame = 0;

    const interval = setInterval(() => {
      frame++;

      const progress = frame / totalFrames;

      const newValues = {};
      for (let key in targets) {
        newValues[key] = Math.round(targets[key] * progress);
      }

      setAnimatedValues(newValues);

      if (frame >= totalFrames) clearInterval(interval);
    }, duration / totalFrames);

    return () => clearInterval(interval);

  }, [
    totalVotes,
    soldeGlobal,
    soldeDisponible,
    soldeCompte,
    autreFrais,
    demandeEnCours,
    demandeTraitee
  ]);

const cards = [
  {
    title: "Total Votes",
    value: animatedValues.totalVotes,
    color: "#2563eb",
    icon: <FaVoteYea size={26} />
  },
  {
    title: "Solde Global (En attente)",
    value: animatedValues.soldeGlobal,
    color: "#16a34a",
    icon: <FaMoneyBillWave size={26} />
  },
  {
    title: "Solde Disponible",
    value: animatedValues.soldeDisponible,
    color: "#f59e0b",
    icon: <FaWallet size={26} />
  },
  {
    title: "Solde Compte Total",
    value: animatedValues.soldeCompte,
    color: "#7c3aed",
    icon: <FaUniversity size={26} />
  },
  {
    title: "Autre Frais",
    value: animatedValues.autreFrais,
    color: "#ef4444",
    icon: <FaMoneyBillWave size={26} />
  },
  {
    title: "Demandes en cours",
    value: animatedValues.demandeEnCours,
    color: "#f97316",
    icon: <FaClock size={26} />
  },
  {
    title: "Demandes traitées",
    value: animatedValues.demandeTraitee,
    color: "#059669",
    icon: <FaCheckCircle size={26} />
  }
];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 20,
        marginTop: 20
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: 20,
            textAlign: "center",
            transition: "transform 0.2s, box-shadow 0.2s",
            cursor: "default"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.boxShadow =
              "0 8px 20px rgba(0,0,0,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(0,0,0,0.1)";
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 8
            }}
          >
            <div style={{ color: card.color }}>{card.icon}</div>
            <div
              style={{
                fontSize: 13,
                color: "#6b7280",
                fontWeight: 600,
                textTransform: "uppercase"
              }}
            >
              {card.title}
            </div>
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: card.color,
              marginTop: 6
            }}
          >
            {card.value.toLocaleString()} F
          </div>
        </div>
      ))}
    </div>
  );
}
