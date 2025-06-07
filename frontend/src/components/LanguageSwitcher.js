import React from "react";
import "../styles/LanguageSwitcher.css";

export default function LanguageSwitcher({ activeLang, onLanguageChange }) {
  return (
    <div className="lang-switcher">
      <button
        className={`lang-button ${activeLang === "PL" ? "active" : ""}`}
        onClick={() => onLanguageChange("PL")}
      >
        PL
      </button>
      <button
        className={`lang-button ${activeLang === "EN" ? "active" : ""}`}
        onClick={() => onLanguageChange("EN")}
      >
        EN
      </button>
    </div>
  );
}