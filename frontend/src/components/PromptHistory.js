import React from "react";
import "../styles/PromptHistory.css";

export default function PromptHistory({ history, onSelect }) {
  return (
    <div className="prompt-history-wrapper">
      <div className="prompt-history-container">
        {history.length === 0 ? (
          <div className="prompt-history-item">Brak historii</div>
        ) : (
          history.map((item, idx) => (
            <div
              key={idx}
              className="prompt-history-item"
              onClick={() => {
                if (typeof onSelect === "function") {
                  onSelect(item);
                } else {
                  console.warn("onSelect function is not defined");
                }
              }}
            >
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}