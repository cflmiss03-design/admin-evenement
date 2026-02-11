import { useState } from "react";
import { FaTachometerAlt, FaMoneyCheckAlt, FaBars } from "react-icons/fa";

export default function Sidebar({ activePage, onNavigate }) {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { title: "Dashboard", key: "dashboard", icon: <FaTachometerAlt /> },
    { title: "Retraits", key: "withdrawals", icon: <FaMoneyCheckAlt /> }
  ];

  return (
    <>
      <div
        style={{
          display: "none",
          position: "fixed",
          top: 12,
          left: 12,
          backgroundColor: "#2563eb",
          color: "#fff",
          padding: 8,
          borderRadius: 6,
          cursor: "pointer",
          zIndex: 1000
        }}
        onClick={() => setIsOpen(!isOpen)}
        className="sidebar-toggle"
      >
        <FaBars />
      </div>

      <div
        style={{
          width: isOpen ? 220 : 60,
          backgroundColor: "#1f2937",
          color: "#fff",
          padding: 20,
          minHeight: "100vh",
          transition: "width 0.3s",
          position: "fixed",
          top: 0,
          left: 0
        }}
      >
        <h3 style={{ marginBottom: 30 }}>
          {isOpen ? "Manager" : "M"}
        </h3>

        {menuItems.map((item) => (
          <div
            key={item.key}
            onClick={() => onNavigate(item.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: isOpen ? 12 : 0,
              padding: "10px 8px",
              borderRadius: 8,
              marginBottom: 8,
              cursor: "pointer",
              backgroundColor:
                activePage === item.key ? "#2563eb" : "transparent"
            }}
          >
            <div>{item.icon}</div>
            {isOpen && <span>{item.title}</span>}
          </div>
        ))}
      </div>
    </>
  );
}
