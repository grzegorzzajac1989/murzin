import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import LanguageSwitcher from "./LanguageSwitcher";
import MicInput from "./MicInput";
import PromptHistory from "./PromptHistory";
import { FaSearch, FaRegImage } from "react-icons/fa";
import "./dropdown.css";

const API_URL = "https://murzin.onrender.com";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [login, setLogin] = useState(localStorage.getItem("login") || "");
  const [password, setPassword] = useState("");
  const [scoreboard, setScoreboard] = useState([]);
  const [language, setLanguage] = useState("PL");
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState(JSON.parse(localStorage.getItem("history") || "[]"));
  const [showHistory, setShowHistory] = useState(false);

  const promptInputRef = useRef(null);

  const updateScoreboard = () => {
    if (token) {
      fetch(`${API_URL}/scoreboard`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok && res.json())
        .then(setScoreboard)
        .catch(() => {});
    }
  };

  useEffect(updateScoreboard, [token]);
  useEffect(() => localStorage.setItem("history", JSON.stringify(history)), [history]);

  useEffect(() => {
    if (token && promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, [token]);

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
        localStorage.setItem("login", login);
        setPassword("");
        updateScoreboard();
      }
    } catch {}
  };

  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
    localStorage.removeItem("login");
    setLogin("");
    setPassword("");
    setScoreboard([]);
  };

  const addPoints = async (points = 1) => {
    if (token) {
      try {
        const res = await fetch(`${API_URL}/add_points`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ points }),
        });
        if (res.ok) updateScoreboard();
      } catch {}
    }
  };

  const submitPrompt = async (e) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`${API_URL}/analyze_prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: trimmed }),
      });
      if (res.ok) {
        const { points, total } = await res.json();
        setHistory(h => [trimmed, ...h.filter(p => p !== trimmed)].slice(0, 5));
        setPrompt("");
        alert(`Prompt analyzed! You earned ${points} points. Total: ${total}`);
        updateScoreboard();
        promptInputRef.current?.focus();
      } else {
        alert("Error analyzing prompt.");
      }
    } catch {
      alert("Error analyzing prompt.");
    }
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
            onKeyDown={e => e.key === "Enter" && document.querySelector(".auth-input[type='password']")?.focus()}
            autoFocus
          />
          <input
            type="password"
            placeholder={language === "PL" ? "Hasło" : "Password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="auth-input"
            onKeyDown={e => e.key === "Enter" && auth()}
          />
          <button onClick={auth} className="auth-button">{language === "PL" ? "Zaloguj / Zarejestruj" : "Log In / Register"}</button>
        </div>
      ) : (
        <>
          <div className="top-left-bar">
            <button onClick={logout} className="logout-button" aria-label="Logout">&lt;</button>
            <button className="hamburger-menu" aria-label="Menu">&#9776;</button>
            <span className="user-name">{displayName}</span>
          </div>

          <div className="scoreboard-container">
            {scoreboard.length === 0
              ? <p>{language === "PL" ? "Brak wyników" : "No results"}</p>
              : scoreboard.map(({ user, score }) => (
                <div key={user} className="score-entry"><span>{user}</span><span>{score}</span></div>
              ))
            }
          </div>

          <form
            onSubmit={submitPrompt}
            className="prompt-input-form bottom-centered"
            autoComplete="off"
            spellCheck="false"
          >
            <div className="prompt-input-icon-left" onClick={() => setShowHistory(v => !v)} style={{ cursor: "pointer" }}>
              <FaSearch size={20} />
            </div>
            <input
              ref={promptInputRef}
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

          {showHistory && (
            <PromptHistory
              history={history}
              onSelect={item => {
                setPrompt(item);
                setShowHistory(false);
                promptInputRef.current?.focus();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}