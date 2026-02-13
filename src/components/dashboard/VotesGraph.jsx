import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function VotesGraph({ candidates }) {
  // Exemple de données : somme des votes par jour (mock)
  const labels = ["Feb J1", "Feb J2", "Feb J3", "Feb J4", "Feb J5"];
  const data = {
    labels,
    datasets: [
      {
        label: "Nombre de votes",
        data: [474, 599, 812, 1177, 1643], // tu peux remplacer par des vrais stats
        borderColor: "#2563EB",
        backgroundColor: "rgba(37,99,235,0.2)",
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="bg-white shadow-soft rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Évolution du nombre de votes</h3>
      <Line data={data} />
    </div>
  );
}
