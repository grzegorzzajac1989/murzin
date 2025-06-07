import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./LoginPage";
import MainApp from "./MainApp";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [login, setLogin] = useState(localStorage.getItem("login") || "");

  const handleLogin = (newToken, newLogin) => {
    console.log("Logging in:", { newToken, newLogin }); // Debug
    setToken(newToken);
    setLogin(newLogin);
    localStorage.setItem("token", newToken);
    localStorage.setItem("login", newLogin);
  };

  const logout = () => {
    console.log("Logging out"); // Debug
    setToken("");
    setLogin("");
    localStorage.removeItem("token");
    localStorage.removeItem("login");
  };

  return (
    <Router>
      <Routes>
        {/* Jeśli zalogowany, przekieruj na /app */}
        <Route
          path="/login"
          element={
            token ? <Navigate to="/app" replace /> : <LoginPage onLogin={handleLogin} />
          }
        />

        {/* Jeśli nie zalogowany, przekieruj na /login */}
        <Route
          path="/app/*"
          element={
            token ? (
              <MainApp token={token} login={login} onLogin={handleLogin} logout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Obsługa wszystkich innych ścieżek */}
        <Route path="*" element={<Navigate to={token ? "/app" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}