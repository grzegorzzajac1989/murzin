import React, { useState, useEffect } from "react";
import "./styles/App.css";
import Header from "./components/Header/Header";
import Scoreboard from "./components/Scoreboard";
import PromptForm from "./components/PromptForm";

const API_URL = "https://murzin.onrender.com";

export default function MainApp({ token, login, onLogin, logout }) {
  const [scoreboard, setScoreboard] = useState([]);
  const [language, setLanguage] = useState("PL");
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("history") || "[]")
  );
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/scoreboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.status === 401) {
            logout();
            return null;
          }
          return res.ok ? res.json() : null;
        })
        .then((data) => {
          if (data) setScoreboard(data);
        })
        .catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const submitPrompt = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/analyze_prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: trimmed }),
      });

      if (res.status === 401) {
        alert(
          language === "PL"
            ? "Brak autoryzacji. Zaloguj się ponownie."
            : "Unauthorized. Please login again."
        );
        logout();
        return;
      }

      if (res.ok) {
        const { points, total } = await res.json();
        setHistory((h) => {
          const newHistory = [trimmed, ...h.filter((p) => p !== trimmed)].slice(0, 5);
          return newHistory;
        });
        setPrompt("");
        alert(
          language === "PL"
            ? `Prompt przeanalizowany! Zdobyłeś ${points} punktów. Razem: ${total}`
            : `Prompt analyzed! You earned ${points} points. Total: ${total}`
        );

        // Odśwież scoreboard po udanym wysłaniu
        const scoreboardRes = await fetch(`${API_URL}/scoreboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (scoreboardRes.ok) {
          const updatedScoreboard = await scoreboardRes.json();
          setScoreboard(updatedScoreboard);
        }
      } else {
        alert(
          language === "PL" ? "Błąd analizy prompta." : "Error analyzing prompt."
        );
      }
    } catch {
      alert(
        language === "PL" ? "Błąd analizy prompta." : "Error analyzing prompt."
      );
    } finally {
      setShowHistory(true); // Przenieś tutaj, aby uniknąć szybkiego zamknięcia
      setLoading(false);
    }
  };

  return (
    <div className={`app-container${token ? " logged-in" : ""}`}>
      <Header
        language={language}
        onLanguageChange={setLanguage}
        onLogout={logout}
        isLoggedIn={!!token}
      />

      <Scoreboard scoreboard={scoreboard} language={language} />
      <PromptForm
        token={token}
        prompt={prompt}
        setPrompt={setPrompt}
        submitPrompt={submitPrompt}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        history={history}
        onSelectHistory={(item) => {
          setPrompt(item);
          setShowHistory(false);
        }}
        language={language}
        loading={loading}
      />
    </div>
  );
}