import { useState, useEffect } from "react";
import {
  FaTachometerAlt,
  FaMoneyCheckAlt,
  FaBars,
  FaVoteYea,
  FaExchangeAlt,
  FaTicketAlt
} from "react-icons/fa";

export default function Sidebar({ activePage, onNavigate }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Détection écran
  useEffect(() => {
    const checkScreen = () => {
      if (window.innerWidth < 768) {
        setIsMobile(true);
        setIsOpen(false);
      } else {
        setIsMobile(false);
        setIsOpen(true);
      }
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const menuItems = [
    { title: "Accueil", key: "dashboard", icon: <FaTachometerAlt /> },
    { title: "Retraits", key: "withdrawals", icon: <FaMoneyCheckAlt /> },
    { title: "Votes", key: "votes", icon: <FaVoteYea /> },
    { title: "Tickets", key: "tickets", icon: <FaTicketAlt /> },
    { title: "Fedapay", key: "fedapay", icon: <FaExchangeAlt /> }
  ];

  return (
    <>
      {/* Bouton mobile */}
      {isMobile && (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-3 left-3 bg-blue-600 text-white p-2 rounded-md cursor-pointer z-[1200]"
        >
          <FaBars />
        </div>
      )}

      {/* Overlay mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[1100]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-screen
          bg-blue-900 text-white
          w-[200px]
          p-4
          transition-transform duration-300
          z-[1200]
          ${isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : ""}
        `}
      >
        <h3 className="mb-6 font-semibold text-lg">
          ADMIN/PROMOTEUR
        </h3>

        {menuItems.map((item) => (
          <div
            key={item.key}
            onClick={() => {
              onNavigate(item.key);
              if (isMobile) setIsOpen(false);
            }}
            className={`
              flex items-center gap-3
              px-3 py-2 mb-2
              rounded-lg cursor-pointer
              ${
                activePage === item.key
                  ? "bg-blue-600"
                  : "hover:bg-gray-700"
              }
            `}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="whitespace-nowrap">{item.title}</span>
          </div>
        ))}
      </div>
    </>
  );
}
