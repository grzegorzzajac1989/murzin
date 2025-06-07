import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./LoginPage";
import MainApp from "./MainApp";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [login, setLogin] = useState(localStorage.getItem("login") || "");

  const handleLogin = (token, login) => {
    setToken(token);
    setLogin(login);
    localStorage.setItem("token", token);
    localStorage.setItem("login", login);
  };

  const logout = () => {
    setToken("");
    setLogin("");
    localStorage.removeItem("token");
    localStorage.removeItem("login");
  };

  return (
    <Router basename="/">
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/app" /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/app/*"
          element={token ? <MainApp token={token} logout={logout} login={login} /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to={token ? "/app" : "/login"} />} />
      </Routes>
    </Router>
  );
}