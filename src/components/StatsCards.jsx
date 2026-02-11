import { useEffect, useState } from "react";
import { FaVoteYea, FaMoneyBillWave, FaWallet } from "react-icons/fa";

export default function StatsCards({ totalVotes, globalBalance, availableBalance }) {
  // Animation des chiffres
  const [animatedVotes, setAnimatedVotes] = useState(0);
  const [animatedGlobal, setAnimatedGlobal] = useState(0);
  const [animatedAvailable, setAnimatedAvailable] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1 seconde
    const frameRate = 30;
    const totalFrames = Math.round((duration / 1000) * frameRate);

    function animate(target, setter) {
      let frame = 0;
      const count = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        setter(Math.round(target * progress));
        if (frame === totalFrames) clearInterval(count);
      }, duration / totalFrames);
    }

    animate(totalVotes, setAnimatedVotes);
    animate(globalBalance, setAnimatedGlobal);
    animate(availableBalance, setAnimatedAvailable);
  }, [totalVotes, globalBalance, availableBalance]);

  const cards = [
    { title: "Total Votes", value: animatedVotes, color: "#2563eb", icon: <FaVoteYea size={28} /> },
    { title: "Solde Global", value: animatedGlobal, color: "#16a34a", icon: <FaMoneyBillWave size={28} /> },
    { title: "Solde Disponible", value: animatedAvailable, color: "#f59e0b", icon: <FaWallet size={28} /> }
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: 20
      }}
    >
      {cards.map((card) => (
        <div
          key={card.title}
          style={{
            flex: "1 1 200px",
            backgroundColor: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: 20,
            textAlign: "center",
            transition: "transform 0.2s, box-shadow 0.2s",
            cursor: "default",
            minWidth: 180
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ color: card.color }}>{card.icon}</div>
            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
                fontWeight: 500,
                textTransform: "uppercase"
              }}
            >
              {card.title}
            </div>
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: card.color,
              marginTop: 4
            }}
          >
            {card.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
