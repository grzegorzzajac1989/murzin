import React, { useRef, useEffect } from "react";
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

  useEffect(() => {
    if (loginInputRef.current) {
      loginInputRef.current.focus();
    }
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-panel">
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
          autoFocus
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