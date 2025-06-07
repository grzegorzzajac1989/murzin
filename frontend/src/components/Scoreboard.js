import React from "react";
import "../styles/Scoreboard.css";

export default function Scoreboard({ scoreboard, language }) {
  if (scoreboard.length === 0)
    return <p>{language === "PL" ? "Brak wyników" : "No results"}</p>;

  return (
    <div className="scoreboard-container">
      {scoreboard.map(({ user, score }) => (
        <div key={user} className="score-entry">
          <span>{user}</span><span>{score}</span>
        </div>
      ))}
    </div>
  );
}