from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Prosta baza użytkowników w pamięci (na start)
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
        # Logowanie
        if check_password_hash(users[login]['password_hash'], password):
            return jsonify({"message": "Zalogowano", "user": login}), 200
        else:
            return jsonify({"error": "Błędne hasło"}), 401
    else:
        # Rejestracja
        users[login] = {"password_hash": generate_password_hash(password)}
        scores[login] = 0
        return jsonify({"message": "Konto utworzone i zalogowano", "user": login}), 201

@app.route('/add_points', methods=['POST'])
def add_points():
    data = request.get_json()
    if not data or 'user' not in data:
        return jsonify({"error": "Missing 'user' field"}), 400

    user = data['user']
    points = data.get('points', 1)  # Domyślnie 1 punkt

    if user not in users:
        return jsonify({"error": "Nie znaleziono użytkownika"}), 404

    scores[user] = scores.get(user, 0) + points
    return jsonify({"message": f"Dodano {points} punktów dla {user}", "total": scores[user]}), 200

@app.route('/scoreboard', methods=['GET'])
def scoreboard():
    # Ranking wg punktów malejąco
    ranking = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return jsonify(ranking), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000, debug=True)