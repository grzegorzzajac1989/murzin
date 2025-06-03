import React, { useState, useEffect } from "react";

const API_URL = "https://murzin.onrender.com";

function App() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [message, setMessage] = useState("");
  const [scoreboard, setScoreboard] = useState([]);

  // Authentication
  const handleAuth = async () => {
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        setMessage(data.message);
        fetchScoreboard(data.token);
      } else {
        setMessage(data.error || "Error");
      }
    } catch {
      setMessage("Network error");
    }
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("token");
    setMessage("");
    setLogin("");
    setPassword("");
    // Nie czyścimy scoreboardu, żeby był widoczny po logout
  };

  const fetchScoreboard = async (useToken) => {
    try {
      const headers = useToken ? { Authorization: `Bearer ${useToken}` } : {};
      const res = await fetch(`${API_URL}/scoreboard`, { headers });
      const data = await res.json();
      if (res.ok) {
        setScoreboard(data);
        setMessage("");
      } else {
        setScoreboard([]);
      }
    } catch {
      setMessage("Network error");
    }
  };

  const handleAddPoints = async () => {
    if (!token) {
      setMessage("You need to log in");
      return;
    }
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/add_points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points: 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchScoreboard(token);
      } else {
        setMessage(data.error || "Error");
      }
    } catch {
      setMessage("Network error");
    }
  };

  useEffect(() => {
    fetchScoreboard(token);
  }, [token]);

  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "#fff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
      }}
    >
      {!token && (
        <div
          style={{
            marginBottom: 30,
            maxWidth: 320,
            width: "100%",
          }}
        >
          <input
            placeholder="Login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            style={{
              padding: 8,
              marginBottom: 10,
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 4,
              border: "1px solid #fff",
              backgroundColor: "#222",
              color: "#fff",
            }}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: 8,
              marginBottom: 10,
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 4,
              border: "1px solid #fff",
              backgroundColor: "#222",
              color: "#fff",
            }}
          />
          <button
            onClick={handleAuth}
            style={{
              backgroundColor: "red",
              color: "white",
              border: "none",
              padding: "10px 20px",
              cursor: "pointer",
              borderRadius: 4,
              fontWeight: "bold",
              fontSize: 16,
              width: "100%",
            }}
          >
            Login / Register
          </button>
        </div>
      )}

      {token && (
        <button
          onClick={handleAddPoints}
          style={{
            backgroundColor: "red",
            borderRadius: "50%",
            width: 60,
            height: 60,
            fontSize: 24,
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            marginBottom: 20,
          }}
          title="Add 1 point"
        >
          +
        </button>
      )}

      {/* Scoreboard zawsze widoczny */}
      <div
        style={{
          maxWidth: 320,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <h2 style={{ marginBottom: 12 }}>Scoreboard</h2>
        {scoreboard.map(([user, score]) => (
          <div
            key={user}
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#fff",
              padding: "6px 10px",
              borderRadius: 4,
              fontWeight: "bold",
              backgroundColor: "#000",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            <span style={{ textAlign: "left", minWidth: 0, flexShrink: 1 }}>
              {user}
            </span>
            <span style={{ marginLeft: 10, flexShrink: 0 }}>{score}</span>
          </div>
        ))}

        {token && (
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "gray",
              color: "white",
              border: "none",
              padding: "8px 16px",
              cursor: "pointer",
              borderRadius: 4,
              fontWeight: "bold",
              alignSelf: "flex-end",
              marginTop: 20,
              width: "auto",
            }}
          >
            Logout
          </button>
        )}
      </div>

      <p
        style={{
          color: "red",
          maxWidth: 320,
          marginTop: 20,
          marginLeft: "auto",
          marginRight: "auto",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {message}
      </p>
    </div>
  );
}

export default App;