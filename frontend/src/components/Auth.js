import React, { useRef, useEffect, useState } from "react";
import "../styles/Auth.css";

export default function Auth({
  login,
  setLogin,
  password,
  setPassword,
  auth,
  language,
  loading,
}) {
  const loginInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const [panelHeight, setPanelHeight] = useState("auto");

  useEffect(() => {
    if (loginInputRef.current && !loading) {
      loginInputRef.current.focus();
    }
  }, [loading]);

  useEffect(() => {
    const adjustHeight = () => {
      const windowHeight = window.innerHeight; // Aktualna wysokość okna
      const adjustedHeight = windowHeight * 0.6; // Panel zajmuje 60% ekranu
      setPanelHeight(`${adjustedHeight}px`);
    };

    adjustHeight();
    window.addEventListener("resize", adjustHeight);

    return () => {
      window.removeEventListener("resize", adjustHeight);
    };
  }, []);

  return (
    <div className="auth-container">
      <div
        className="auth-panel"
        style={{ height: panelHeight }}
      >
        <input
          ref={loginInputRef}
          placeholder={language === "PL" ? "Login" : "Username"}
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && passwordInputRef.current) {
              passwordInputRef.current.focus();
            }
          }}
          className="auth-input"
          disabled={loading}
        />
        <input
          ref={passwordInputRef}
          type="password"
          placeholder={language === "PL" ? "Hasło" : "Password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              auth();
            }
          }}
          className="auth-input"
          disabled={loading}
        />
        <button
          onClick={auth}
          className="auth-button"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <div className="spinner"></div>
          ) : language === "PL" ? (
            "Zaloguj / Zarejestruj"
          ) : (
            "Log In / Register"
          )}
        </button>
      </div>
    </div>
  );
}