import React, { useState, useEffect, useRef } from "react";
import { InteractiveForm } from "./InteractiveForm";
import "./App.css";
import LanguageSwitcher from "./LanguageSwitcher";

const API_URL = "https://murzin.onrender.com";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [scoreboard, setScoreboard] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [language, setLanguage] = useState("PL");

  const holdTimer = useRef(null);

  useEffect(() => {
    if (token) fetchScoreboard();
  }, [token]);

  async function fetchScoreboard() {
    try {
      const res = await fetch(`${API_URL}/scoreboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setScoreboard(data);
      } else {
        setMessage(language === "PL" ? "Błąd pobierania scoreboardu" : "Error fetching scoreboard");
      }
    } catch {
      setMessage(language === "PL" ? "Błąd sieci" : "Network error");
    }
  }

  async function handleAuth() {
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        fetchScoreboard();
        setMessage(language === "PL" ? "Zalogowano" : "Logged in");
      } else {
        setMessage(data.error || (language === "PL" ? "Błąd logowania" : "Login error"));
      }
    } catch {
      setMessage(language === "PL" ? "Błąd sieci" : "Network error");
    }
  }

  function handleLogout() {
    setToken("");
    localStorage.removeItem("token");
    setLogin("");
    setPassword("");
    setMessage("");
    setScoreboard([]);
    setShowForm(false);
    setFormData({});
  }

  function handleBackOrLogout() {
    if (showForm) {
      setShowForm(false);
    } else {
      handleLogout();
    }
  }

  const sumPoints = (data) => {
    if (!data) return 0;
    let points = 0;

    if (data.typGrupy === "pojedynczy") {
      points += 1;
    }

    if (data.typGrupy === "gang") {
      if (data.gangSize === "mala") points += 3;
      else if (data.gangSize === "srednia") points += 5;
      else if (data.gangSize === "duza") points += 8;
    }

    if (data.wyglad === "wyjatkowa_uroda") {
      points += 2;

      if (data.wyjatkowaUrodaDetails === "hot_murzinka") points += 2;
      if (data.wyjatkowaUrodaDetails === "przystojny_murzin") points += 2;
    }

    if (data.status === "gangsta") {
      points += 3;
      if (data.gangstaAccessories) points += 1;
    }

    if (data.status === "przedsiebiorca") {
      points += 2;
      if (data.entrepreneurDetails) points += 1;
    }

    if (data.status === "uciekajacy") {
      points += 1;
      if (data.escapingReasons) points += 1;
    }

    return points;
  };

  async function addPoints(points) {
    if (!token) {
      setMessage(language === "PL" ? "Zaloguj się, aby dodawać punkty" : "Log in to add points");
      return false;
    }
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/add_points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || (language === "PL" ? "Dodano punkty" : "Points added"));
        fetchScoreboard();
        return true;
      } else {
        setMessage(data.error || (language === "PL" ? "Błąd dodawania punktów" : "Error adding points"));
        return false;
      }
    } catch {
      setMessage(language === "PL" ? "Błąd sieci" : "Network error");
      return false;
    }
  }

  async function handleFormSubmit(data) {
    setFormData(data);
    const points = sumPoints(data);
    if (points === 0) {
      setMessage(language === "PL" ? "Formularz jest pusty lub niekompletny." : "Form is empty or incomplete.");
      return;
    }
    const success = await addPoints(points);
    if (success) {
      setShowForm(false);
      setFormData({});
    }
  }

  function handlePointerDown() {
    holdTimer.current = setTimeout(() => {
      setShowForm(true);
      setMessage(language === "PL" ? "Wybierz opcje i kliknij +, aby dodać punkty" : "Select options and click + to add points");
    }, 1000);
  }

  function handlePointerUp() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
      if (!showForm) {
        addPoints(1);
      } else {
        document.querySelector("form")?.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
    }
  }

  return (
    <div className="app-container">
      <LanguageSwitcher onLanguageChange={setLanguage} activeLang={language} />
      {!token ? (
        <div className="auth-container">
          <input
            placeholder={language === "PL" ? "Login" : "Username"}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="auth-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                document.querySelector("input[type='password']")?.focus();
              }
            }}
          />
          <input
            type="password"
            placeholder={language === "PL" ? "Hasło" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAuth();
              }
            }}
          />
          <button onClick={handleAuth} className="auth-button">
            {language === "PL" ? "Zaloguj / Zarejestruj" : "Log In / Register"}
          </button>
          <div className="footer">© 2025 Czomik & Czomik</div>
        </div>
      ) : (
        <>
          {showForm && <InteractiveForm onSubmit={handleFormSubmit} />}
          <button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            className="add-button"
            title={
              showForm
                ? language === "PL"
                  ? "Kliknij, aby dodać punkty z formularza"
                  : "Click to add points from the form"
                : language === "PL"
                ? "Kliknij, aby dodać 1 punkt\nPrzytrzymaj 1s, aby otworzyć formularz"
                : "Click to add 1 point\nHold for 1s to open the form"
            }
          >
            +
          </button>
          <button onClick={handleBackOrLogout} className="logout-button">
            &lt;
          </button>
          {!showForm && (
            <div className="scoreboard-container">
              <h2>{language === "PL" ? "Tabela wyników" : "Scoreboard"}</h2>
              {scoreboard.length === 0 && <p>{language === "PL" ? "Brak wyników" : "No results"}</p>}
              {scoreboard.map(([user, score]) => (
                <div key={user} className="score-entry">
                  <span>{user}</span>
                  <span>{score}</span>
                </div>
              ))}
            </div>
          )}
          <div className="footer">© 2025 Czomik & Czomik</div>
        </>
      )}
    </div>
  );
}
