import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaSignOutAlt, FaBell } from "react-icons/fa";

export default function Topbar({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout(); 
    navigate("/admin-alexis"); 
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 24px",
        backgroundColor: "#1f2937",
        color: "#ffffff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        flexWrap: "wrap"
      }}
    >
      {/* Titre Dashboard */}
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>MISS JUMELLES BENIN</h2>

      {/* Right section: notifications + user + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        {/* Notifications */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <FaBell size={20} />
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              backgroundColor: "#ef4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              borderRadius: "50%",
              padding: "2px 5px"
            }}
          >
            3
          </span>
        </div>

        {/* Utilisateur */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              color: "#fff"
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <span style={{ fontWeight: 500 }}>{user?.name || "ALEXIS H."}</span>
        </div>

        {/* Bouton Déconnexion */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            fontWeight: 500,
            transition: "background-color 0.2s, transform 0.2s"
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
          <FaSignOutAlt size={14} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
