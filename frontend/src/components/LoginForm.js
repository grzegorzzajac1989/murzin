import React from "react";
import "../styles/LoginForm.css";

export default function PromptForm({
  token,
  prompt,
  setPrompt,
  submitPrompt,
  showHistory,
  setShowHistory,
  history,
  onSelectHistory,
  language,
  loading,
}) {
  return (
    <div className="prompt-form-container">
      <textarea
        placeholder={
          language === "PL"
            ? "Wpisz prompt i naciśnij Wyślij"
            : "Type prompt and press Send"
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onFocus={() => setShowHistory(false)}
        disabled={!token || loading}
        className="prompt-textarea"
      />

      {showHistory && history.length > 0 && (
        <div className="prompt-history">
          {history.map((item, index) => (
            <div
              key={index}
              className="history-item"
              onClick={() => onSelectHistory(item)}
            >
              {item}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={submitPrompt}
        disabled={loading || !prompt.trim()}
        className="submit-button"
      >
        {language === "PL" ? "Wyślij" : "Send"}
        {loading && <span className="spinner" />}
      </button>
    </div>
  );
}