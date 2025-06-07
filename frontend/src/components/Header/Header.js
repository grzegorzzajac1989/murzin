import React from "react";
import LanguageSwitcher from "../LanguageSwitcher";
import LogoutButton from "../LogoutButton";
import "./Header.css";

export default function Header({ language, onLanguageChange, onLogout }) {
  return (
    <header className="app-header">
      <LogoutButton language={language} onLogout={onLogout} />
      <LanguageSwitcher activeLang={language} onLanguageChange={onLanguageChange} />
    </header>
  );
}