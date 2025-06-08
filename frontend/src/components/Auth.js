import React, { useEffect, useRef } from "react";
import "../styles/Auth.css";

export default function Auth({ login, setLogin, password, setPassword, auth, language }) {
  const loginRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (loginRef.current) {
      loginRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e, nextElement) => {
    if (e.key === "Enter") {
      if (nextElement) {
        nextElement.focus();
      } else {
        auth();
      }
    }
  };

  return (
    <div className="auth-container">
      <input
        placeholder={language === "PL" ? "Login" : "Username"}
        value={login}
        onChange={e => setLogin(e.target.value)}
        onKeyDown={e => handleKeyDown(e, passwordRef.current)}
        className="auth-input"
        ref={loginRef}
      />
      <input
        type="password"
        placeholder={language === "PL" ? "Hasło" : "Password"}
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => handleKeyDown(e, null)}
        className="auth-input"
        ref={passwordRef}
      />
      <button onClick={auth} className="auth-button">
        {language === "PL" ? "Zaloguj / Zarejestruj" : "Log In / Register"}
      </button>
    </div>
  );
}