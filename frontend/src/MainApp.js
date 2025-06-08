import React, { useState, useEffect, useRef } from "react";
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
  const [message, setMessage] = useState(null);

  const promptInputRef = useRef(null);
  const messageTimeoutRef = useRef(null);
  const lastSubmitRef = useRef(0);

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
  }, [token, logout]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (!loading && promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, [loading]);

  // Automatyczne ukrywanie komunikatu po 3 sekundach
  useEffect(() => {
    if (message) {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      messageTimeoutRef.current = setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [message]);

  const submitPrompt = async () => {
    const now = Date.now();
    if (loading) return;
    if (now - lastSubmitRef.current < 3000) {
      setMessage(
        language === "PL"
          ? "Proszę odczekać chwilę przed kolejnym wysłaniem."
          : "Please wait a moment before submitting again."
      );
      return;
    }

    const trimmed = prompt.trim();
    if (!trimmed) return;

    lastSubmitRef.current = now;
    setLoading(true);
    setMessage(null);

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
        setMessage(
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
        setMessage(
          language === "PL"
            ? `Prompt przeanalizowany! Zdobyłeś ${points} punktów. Razem: ${total}`
            : `Prompt analyzed! You earned ${points} points. Total: ${total}`
        );

        const scoreboardRes = await fetch(`${API_URL}/scoreboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (scoreboardRes.ok) {
          const updatedScoreboard = await scoreboardRes.json();
          setScoreboard(updatedScoreboard);
        }
      } else {
        setMessage(language === "PL" ? "Błąd analizy prompta." : "Error analyzing prompt.");
      }
    } catch {
      setMessage(language === "PL" ? "Błąd analizy prompta." : "Error analyzing prompt.");
    } finally {
      setShowHistory(true);
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

      {message && (
        <div
          className="message-banner"
          style={{ padding: "10px", background: "#f0f0f0", marginBottom: "10px" }}
          role="alert"
          aria-live="assertive"
        >
          {message}
        </div>
      )}

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
        inputRef={promptInputRef}
      />
    </div>
  );
}