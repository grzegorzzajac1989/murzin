import React, { useState, useEffect } from "react";

const API_URL = "https://murzin.onrender.com";

function App() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [points, setPoints] = useState(1);
  const [userToAdd, setUserToAdd] = useState("");
  const [scoreboard, setScoreboard] = useState([]);
  const [message, setMessage] = useState("");

  // Authentication (Login/Registration)
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
        setMessage(data.message);
      } else {
        setMessage(data.error || "Error");
      }
    } catch (e) {
      setMessage("Network error");
    }
  };

  // Add points
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
        body: JSON.stringify({ user: userToAdd || login, points: Number(points) }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchScoreboard();
      } else {
        setMessage(data.error || "Error");
      }
    } catch (e) {
      setMessage("Network error");
    }
  };

  // Fetch scoreboard
  const fetchScoreboard = async () => {
    try {
      const res = await fetch(`${API_URL}/scoreboard`);
      const data = await res.json();
      if (res.ok) {
        setScoreboard(data);
      } else {
        setMessage("Failed to fetch scoreboard");
      }
    } catch {
      setMessage("Network error");
    }
  };

  useEffect(() => {
    fetchScoreboard();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Murzin - Watching Score Tracker</h1>

      <h2>Login / Register</h2>
      <input
        placeholder="Login"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
      />
      <br />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button onClick={handleAuth}>Login / Register</button>

      <h2>Add Points</h2>
      <input
        placeholder="User (leave blank for logged-in user)"
        value={userToAdd}
        onChange={(e) => setUserToAdd(e.target.value)}
      />
      <br />
      <input
        type="number"
        min="1"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
      />
      <br />
      <button onClick={handleAddPoints}>Add Points</button>

      <h2>Scoreboard</h2>
      <ul>
        {scoreboard.map(([user, score]) => (
          <li key={user}>
            {user}: {score}
          </li>
        ))}
      </ul>

      <p style={{ color: "red" }}>{message}</p>
    </div>
  );
}

export default App;