import React from "react";
import "../styles/Auth.css";

export default function Auth({ login, setLogin, password, setPassword, auth, language }) {
  return (
    <div className="auth-container">
      <input
        placeholder={language === "PL" ? "Login" : "Username"}
        value={login}
        onChange={e => setLogin(e.target.value)}
        className="auth-input"
        autoFocus
      />
      <input
        type="password"
        placeholder={language === "PL" ? "Hasło" : "Password"}
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="auth-input"
      />
      <button onClick={auth} className="auth-button">
        {language === "PL" ? "Zaloguj / Zarejestruj" : "Log In / Register"}
      </button>
    </div>
  );
}