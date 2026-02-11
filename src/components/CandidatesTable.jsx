import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ManagerClient() {
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date().toLocaleString('fr-FR');

  useEffect(() => {
    async function loadCandidates() {
      try {
        const res = await fetch("http://localhost:5000/api/manager");
        if (!res.ok) throw new Error("Impossible de charger les candidates.");
        setCandidates(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  const sortedCandidates = [...candidates].sort(
    (a, b) => (b.totalVotes || 0) - (a.totalVotes || 0)
  );

  function formatOrdre(position) {
    if (position === 1) return "1ère";
    if (position === 2) return "2e";
    if (position === 3) return "3e";
    return position + "e";
  }

  function getRowStyle(position, index) {
    if (position === 1) return { fillColor: [255, 215, 0] }; // Or
    if (position === 2) return { fillColor: [192, 192, 192] }; // Argent
    if (position === 3) return { fillColor: [205, 127, 50] }; // Bronze
    return index % 2 === 0 ? { fillColor: [255, 255, 255] } : { fillColor: [244, 246, 248] }; // Zebra
  }

function exportPDF() {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();

  // Titre centré
  doc.setFontSize(18);
  const title = "CLASSEMENT OFFICIEL — CONCOURS MISS JUMELLES BÉNIN 2026";
  const textWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - textWidth) / 2, 20);

  const tableData = sortedCandidates.map((c, index) => [
    formatOrdre(index + 1),
    c.orderNumber,
    `${c.lastName} ${c.firstName} - ${c.secondName}`,
    c.totalVotes || 0
  ]);

  autoTable(doc, {
    head: [['Ordre', 'Candidates N°', 'Nom', 'Total Votes']],
    body: tableData,
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: [31, 41, 55], textColor: 255, halign: 'center' },
    bodyStyles: { fontSize: 11, halign: 'center', minCellHeight: 6, cellPadding: 3 },
    styles: { overflow: 'linebreak' }, // permet de couper le texte long
    showHead: 'everyPage',
    didParseCell: function (data) {
      if (data.section === 'body') {
        const index = data.row.index + 1;
        if (index === 1) data.cell.styles.fillColor = [255, 215, 0]; // Or
        else if (index === 2) data.cell.styles.fillColor = [192, 192, 192]; // Argent
        else if (index === 3) data.cell.styles.fillColor = [205, 127, 50]; // Bronze
        else if (index % 2 === 0) data.cell.styles.fillColor = [255, 255, 255];
        else data.cell.styles.fillColor = [244, 246, 248];

        if (data.column.index === 2) data.cell.styles.halign = 'left';
      }
      if (data.section === 'head') {
        data.cell.styles.fillColor = [31, 41, 55];
        data.cell.styles.textColor = 255;
      }
    },
  });

  doc.setFontSize(10);

  // Footer sur chaque page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 35;
    doc.text(`Evènement : Concours Miss Jumelles Bénin 2026`, 14, footerY);
    doc.text(`Date début vote : 07 Février 2026`, 14, footerY + 5);
    doc.text(`Date fin vote : 30 Mars 2026`, 14, footerY + 10);
    doc.text(`Date export : ${now}`, pageWidth - 60, footerY);
    doc.text("GROUPE CFL WORD", pageWidth - 60, footerY + 5);
    doc.text("§229 0147471465 (WhatsApp)", pageWidth - 60, footerY + 10);
  }

  // Nom PDF unique
  const nowDate = new Date();
  const codeUnique = `${nowDate.getHours()}${nowDate.getMinutes()}${nowDate.getSeconds()}`;
  doc.save(`Classement_Concours_Miss_Jumelles_Benin_2026_${codeUnique}.pdf`);
}

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <button
        onClick={exportPDF}
        style={{
          marginBottom: 15,
          padding: "10px 16px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer"
        }}
      >
        📄 Télécharger en PDF
      </button>

      <h2 style={{ textAlign: "center" }}>
        CLASSEMENT OFFICIEL — CONCOURS MISS JUMELLES BÉNIN 2026
      </h2>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ backgroundColor: "#1f2937", color: "white" }}>
              <th style={{ padding: 12 }}>Ordre</th>
              <th style={{ padding: 12 }}>Candidates N°</th>
              <th style={{ padding: 12 }}>Nom</th>
              <th style={{ padding: 12 }}>Total Votes</th>
            </tr>
          </thead>
          <tbody>
            {sortedCandidates.map((c, index) => {
              const position = index + 1;
              const style = getRowStyle(position, index);
              return (
                <tr key={c._id} style={{ backgroundColor: `rgb(${style.fillColor.join(",")})` }}>
                  <td style={{ padding: 10 }}>{formatOrdre(position)}</td>
                  <td style={{ padding: 10 }}>{c.orderNumber}</td>
                  <td style={{ padding: 10 }}>
                    {c.lastName} {c.firstName} - {c.secondName}
                  </td>
                  <td style={{ padding: 10 }}>{c.totalVotes || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', fontSize: 14 }}>
        <div>
          <div><strong>Evènement :</strong> Concours Miss Jumelles Bénin 2026</div>
          <div><strong>Date début vote :</strong> 07 Février 2026</div>
          <div><strong>Date fin vote :</strong> 30 Mars 2026</div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div>{now}</div>
          <div><strong>GROUPE CFL WORD</strong></div>
          <div>§229 0147471465 (WhatsApp)</div>
        </div>
      </div>
    </div>
  );
}
