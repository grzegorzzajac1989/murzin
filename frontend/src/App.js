import React, { useState, useEffect } from "react";
import "./App.css";
import LanguageSwitcher from "./LanguageSwitcher";
import MicInput from "./MicInput";
import PromptHistory from "./PromptHistory";
import { FaSearch, FaRegImage } from "react-icons/fa";
import "./dropdown.css";

const API_URL = "https://murzin.onrender.com";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [scoreboard, setScoreboard] = useState([]);
  const [language, setLanguage] = useState("PL");
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("history") || "[]"));
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (token) fetch(`${API_URL}/scoreboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok && res.json())
      .then(setScoreboard)
      .catch(() => {});
  }, [token]);

  useEffect(() => localStorage.setItem("history", JSON.stringify(history)), [history]);

  const auth = async () => {
    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      if (res.ok) {
        const { token } = await res.json();
        setToken(token);
        localStorage.setItem("token", token);
        setPassword("");
      }
    } catch {}
  };

  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
    setLogin("");
    setPassword("");
    setScoreboard([]);
    // nie czyścimy historii - zostaje w localStorage i stanie
  };

  // Logika do dodawania punktów do tablicy wyników
  const addPoints = async (points) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/add_points`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ points }),
      });
      if (res.ok) fetch(`${API_URL}/scoreboard`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok && r.json())
        .then(setScoreboard)
        .catch(() => {});
    } catch {}
  };

  const submitPrompt = (e) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setHistory(h => [trimmed, ...h.filter(p => p !== trimmed)].slice(0, 5));
    setPrompt("");
    setShowHistory(false);
  };

  const displayName = login || (language === "PL" ? "Gość" : "Guest");

  return (
    <div className={`app-container${token ? " logged-in" : ""}`}>
      <LanguageSwitcher onLanguageChange={setLanguage} activeLang={language} />

      {!token ? (
        <div className="auth-container">
          <input
            placeholder={language === "PL" ? "Login" : "Username"}
            value={login}
            onChange={e => setLogin(e.target.value)}
            className="auth-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                document.querySelector(".auth-input[type='password']")?.focus();
              }
            }}
          />
          <input
            type="password"
            placeholder={language === "PL" ? "Hasło" : "Password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="auth-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                auth();
              }
            }}
          />
          <button onClick={auth} className="auth-button">{language === "PL" ? "Zaloguj / Zarejestruj" : "Log In / Register"}</button>
        </div>
      ) : (
        <>
          {/* Ukryty przycisk do dodawania punktów */}
          <button
            onClick={() => addPoints(1)}
            className="add-button"
            style={{ display: "none" }}
          >
            +
          </button>
          <button onClick={logout} className="logout-button">&lt;</button>

          <form onSubmit={submitPrompt} className="prompt-input-form" autoComplete="off" spellCheck="false">
            <div className="prompt-input-icon-left" onClick={() => setShowHistory(v => !v)} style={{ cursor: "pointer" }}><FaSearch size={20} /></div>
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={language === "PL" ? "Wpisz prompt..." : "Enter prompt..."}
              className="prompt-input-field"
            />
            <div className="prompt-input-icon-right">
              <MicInput language={language} onTranscript={text => setPrompt(p => p ? p + " " + text : text)} />
              <FaRegImage size={20} style={{ opacity: 0.4, cursor: "not-allowed", marginLeft: 12 }} />
            </div>
          </form>

          {showHistory && <PromptHistory history={history} onSelect={item => { setPrompt(item); setShowHistory(false); }} />}

          <div className="scoreboard-container">
            {scoreboard.length === 0
              ? <p>{language === "PL" ? "Brak wyników" : "No results"}</p>
              : scoreboard.map(([user, score]) => (
                <div key={user} className="score-entry"><span>{user}</span><span>{score}</span></div>
              ))}
          </div>
        </>
      )}

      <div className="footer">
        © 2025 Czomik & Czomik
        <div className="footer-left">
          <button className="hamburger-menu" aria-label="Menu">&#9776;</button>
          <span className="user-name">{displayName}</span>
        </div>
      </div>
    </div>
  );
}