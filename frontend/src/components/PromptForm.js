import React, { useRef, useEffect } from "react";
import { FaSearch, FaRegImage } from "react-icons/fa";
import MicInput from "./MicInput";
import PromptHistory from "./PromptHistory";
import "../styles/PromptForm.css";

export default function PromptForm({
  token,
  prompt,
  setPrompt,
  submitPrompt,
  history,
  setShowHistory,
  showHistory,
  language,
  onSelectHistory,
  loading, // Nowy prop
}) {
  const containerRef = useRef(null);
  const promptInputRef = useRef(null);

  useEffect(() => {
    if (token && promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target)
      ) {
        setShowHistory(false);
      }
    }

    if (showHistory) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHistory, setShowHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typeof submitPrompt === "function") {
      await submitPrompt();
    }
    setShowHistory(false);
  };

  return (
    <div ref={containerRef}>
      <form
        onSubmit={handleSubmit}
        className="prompt-input-form"
        autoComplete="off"
        spellCheck="false"
      >
        <div
          className="prompt-input-icon-left"
          onClick={() => setShowHistory((v) => !v)}
          style={{ cursor: "pointer" }}
        >
          <FaSearch size={20} />
        </div>
        <input
          ref={promptInputRef}
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={language === "PL" ? "Wpisz prompt..." : "Enter prompt..."}
          className="prompt-input-field"
          disabled={loading}
        />
        <div className="prompt-input-icon-right">
          {loading ? (
            <div className="spinner-inline" />
          ) : (
            <>
              <MicInput
                language={language}
                onTranscript={(text) =>
                  setPrompt((p) => (p ? `${p} ${text}` : text))
                }
              />
              <FaRegImage
                size={20}
                style={{ opacity: 0.4, cursor: "not-allowed", marginLeft: 12 }}
              />
            </>
          )}
        </div>
      </form>

      {showHistory && history.length > 0 && (
        <PromptHistory
          history={history}
          onSelect={(item) => {
            if (typeof onSelectHistory === "function") {
              onSelectHistory(item);
            } else {
              console.warn("onSelectHistory function is not defined");
            }
            promptInputRef.current?.focus();
            setShowHistory(false);
          }}
        />
      )}
    </div>
  );
}