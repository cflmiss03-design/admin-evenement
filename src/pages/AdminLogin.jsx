import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const { login, isAuth } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Si déjà connecté → redirection automatique
  useEffect(() => {
    if (isAuth) {
      navigate("/admin-alexis/dashboard", { replace: true });
    }
  }, [isAuth, navigate]);

  function submit(e) {
    e.preventDefault();

    const success = login(email, password);

    if (success) {
      navigate("/admin-alexis/dashboard", { replace: true });
    } else {
      alert("Accès refusé");
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>Connexion Manager</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Connexion</button>
    </form>
  );
}
