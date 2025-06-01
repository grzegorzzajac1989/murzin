from flask import Flask, request, jsonify, session
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'supersecretkey'

CORS(app, supports_credentials=True, origins=["http://localhost:5500"])

users = {}
scores = {}

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400
    if username in users:
        return jsonify({'error': 'User exists'}), 400
    users[username] = password
    scores[username] = 0
    session['username'] = username
    return jsonify({'message': 'Registered', 'username': username})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400
    if users.get(username) != password:
        return jsonify({'error': 'Incorrect credentials'}), 401
    session['username'] = username
    return jsonify({'message': 'Logged in', 'username': username})

@app.route('/add_point', methods=['POST'])
def add_point():
    if 'username' not in session:
        return jsonify({'error': 'User not logged in'}), 401
    username = session['username']
    scores[username] += 1
    return jsonify({'message': 'Point added', 'username': username, 'score': scores[username]})

@app.route('/leaderboard')
def leaderboard():
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return jsonify(sorted_scores)

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'message': 'Logged out'})

if __name__ == '__main__':
    app.run(port=5001, debug=True)