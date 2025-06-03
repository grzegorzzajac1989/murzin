from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Simple in-memory user and score storage
users = {}
scores = {}

@app.route('/auth', methods=['POST'])
def auth():
    data = request.get_json()
    if not data or 'login' not in data or 'password' not in data:
        return jsonify({"error": "Missing login or password"}), 400

    login = data['login']
    password = data['password']

    if login in users:
        # Login
        if check_password_hash(users[login]['password_hash'], password):
            return jsonify({"message": "Logged in", "user": login}), 200
        else:
            return jsonify({"error": "Invalid password"}), 401
    else:
        # Registration
        users[login] = {"password_hash": generate_password_hash(password)}
        scores[login] = 0
        return jsonify({"message": "Account created and logged in", "user": login}), 201

@app.route('/add_points', methods=['POST'])
def add_points():
    data = request.get_json()
    if not data or 'user' not in data:
        return jsonify({"error": "Missing 'user' field"}), 400

    user = data['user']
    points = data.get('points', 1)  # Default to 1 point

    if user not in users:
        return jsonify({"error": "User not found"}), 404

    scores[user] = scores.get(user, 0) + points
    return jsonify({"message": f"Added {points} points for {user}", "total": scores[user]}), 200

@app.route('/scoreboard', methods=['GET'])
def scoreboard():
    # Sort scores in descending order
    ranking = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return jsonify(ranking), 200

@app.route('/reset', methods=['POST'])
def reset():
    data = request.get_json()
    if not data or 'user' not in data:
        return jsonify({"error": "Missing 'user' field"}), 400

    user = data['user']
    if user not in users:
        return jsonify({"error": "User not found"}), 404

    scores[user] = 0
    return jsonify({"message": f"Score reset for {user}"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000, debug=True)