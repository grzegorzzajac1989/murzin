import React, { useState } from "react";
import Auth from "./components/Auth";  // dostosuj ścieżkę
import "./styles/Auth.css";

const API_URL = "https://murzin.onrender.com";

export default function LoginPage({ onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!login || !password) {
      alert("Wpisz login i hasło");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          onLogin(data.token, login);
          setPassword("");
        } else {
          alert("Brak tokena w odpowiedzi");
        }
      } else if (res.status === 401) {
        alert("Błędny login lub hasło");
      } else {
        alert("Błąd serwera. Spróbuj ponownie.");
      }
    } catch {
      alert("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Auth
      login={login}
      setLogin={setLogin}
      password={password}
      setPassword={setPassword}
      auth={handleAuth}
      language="PL"
      loading={loading}
    />
  );
}