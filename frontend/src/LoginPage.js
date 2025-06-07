import React, { useState } from "react";
import Auth from "./components/Auth";    // ścieżkę dostosuj do swojego projektu
import "./styles/Auth.css";             // import styli do komponentu logowania

export default function LoginPage({ onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = () => {
    // logika autoryzacji (np. fetch, potem onLogin(token, login))
    const fakeToken = "token123"; // przykład na sztywno
    if (login && password) {
      onLogin(fakeToken, login);
    }
  };

  return (
    <Auth
      login={login}
      setLogin={setLogin}
      password={password}
      setPassword={setPassword}
      auth={handleAuth}
      language="PL"
    />
  );
}