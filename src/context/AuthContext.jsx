import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true); // état pour le chargement initial

  // Lecture de la session au démarrage
  useEffect(() => {
    const auth = localStorage.getItem("managerAuth") === "true";
    setIsAuth(auth);
    setLoading(false);
  }, []);

  // Fonction de login
  function login(email, password) {
    if (
      email === import.meta.env.VITE_ADMIN_EMAIL &&
      password === import.meta.env.VITE_ADMIN_PASSWORD
    ) {
      localStorage.setItem("managerAuth", "true");
      setIsAuth(true);
      return true;
    }
    return false;
  }

  // Fonction de logout
  function logout() {
    localStorage.removeItem("managerAuth");
    setIsAuth(false);
  }

  // Déconnexion automatique après 30 minutes d’inactivité
  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout(); // déconnexion
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Événements pour détecter activité utilisateur
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("scroll", resetTimer);

    // Initialiser le timer
    resetTimer();

    // Nettoyage au démontage du composant
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuth, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook pour utiliser le contexte plus facilement
export const useAuth = () => useContext(AuthContext);
