const API_URL = 'http://127.0.0.1:5001';

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const addPointBtn = document.getElementById('addPointBtn');
const statusP = document.getElementById('status');
const authDiv = document.getElementById('auth');
const gameDiv = document.getElementById('game');
const leaderboardList = document.getElementById('leaderboardList');

function updateLeaderboard() {
  fetch(`${API_URL}/leaderboard`, {credentials: 'include'})
    .then(res => res.json())
    .then(data => {
      leaderboardList.innerHTML = '';
      data.forEach(([user, score]) => {
        const li = document.createElement('li');
        li.textContent = `${user}: ${score}`;
        leaderboardList.appendChild(li);
      });
    })
    .catch(() => leaderboardList.innerHTML = '<li>Cannot load leaderboard</li>');
}

function showStatus(msg) {
  statusP.textContent = msg;
}

registerBtn.onclick = () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) {
    showStatus('Fill username and password');
    return;
  }
  fetch(`${API_URL}/register`, {
    method: 'POST',
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  }).then(res => res.json())
    .then(data => {
      if(data.error) {
        showStatus(data.error);
      } else {
        showStatus(`Registered as ${data.username}`);
        authDiv.style.display = 'none';
        gameDiv.style.display = 'block';
        updateLeaderboard();
      }
    }).catch(() => showStatus('Server error'));
};

loginBtn.onclick = () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) {
    showStatus('Fill username and password');
    return;
  }
  fetch(`${API_URL}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  }).then(res => {
    if (res.status === 401) throw new Error('Incorrect credentials');
    return res.json();
  }).then(data => {
    showStatus(`Logged in as ${data.username}`);
    authDiv.style.display = 'none';
    gameDiv.style.display = 'block';
    updateLeaderboard();
  }).catch(e => {
    showStatus(e.message);
  });
};

addPointBtn.onclick = () => {
  fetch(`${API_URL}/add_point`, {
    method: 'POST',
    credentials: 'include',
  }).then(res => {
    if(res.status === 401) throw new Error('User not logged in');
    return res.json();
  }).then(data => {
    showStatus(`${data.username} +1 point (total: ${data.score})`);
    updateLeaderboard();
  }).catch(e => {
    showStatus(e.message);
  });
};

updateLeaderboard();