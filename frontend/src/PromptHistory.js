import React from "react";

export default function PromptHistory({ history, onSelect }) {
  return (
    <div className="prompt-history-dropdown">
      {history.length === 0 ? (
        <div className="prompt-history-item">Brak historii</div>
      ) : (
        history.map((item, idx) => (
          <div
            key={idx}
            className="prompt-history-item"
            onClick={() => onSelect(item)}
          >
            {item}
          </div>
        ))
      )}
    </div>
  );
}