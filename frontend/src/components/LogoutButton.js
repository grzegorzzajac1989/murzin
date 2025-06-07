import React from "react";
import "../styles/LogoutButton.css";

export default function LogoutButton({ language, onLogout }) {
  return (
    <button className="logout-button" onClick={onLogout}>
      {language === "PL" ? "Wyloguj" : "Logout"}
    </button>
  );
}