// src/components/LoginForm.js
import React from "react";
import "../styles/LoginForm.css";

export default function LoginForm({ login, setLogin, password, setPassword, onSubmit, language }) {
  return (
    <form
      className="login-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      autoComplete="off"
      spellCheck="false"
    >
      <input
        type="text"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        placeholder={language === "PL" ? "Login" : "Login"}
        required
        className="login-input"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={language === "PL" ? "Hasło" : "Password"}
        required
        className="login-input"
      />
      <button type="submit" className="login-button">
        {language === "PL" ? "Zaloguj" : "Login"}
      </button>
    </form>
  );
}