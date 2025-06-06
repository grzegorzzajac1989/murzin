import os
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from datetime import datetime, timedelta
from flask_cors import CORS, cross_origin

app = Flask(__name__)
CORS(app)  # globalna obsługa CORS

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'supersecretkey')  # na potrzeby testu warto ustawić domyślnie

users, scores = {}, {}

def token_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.headers.get('Authorization', '').replace('Bearer ', '')
            if not token:
                return jsonify({"error": "Token is missing"}), 401
            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                user, user_role = data['user'], users.get(data['user'], {}).get('role')
                if user not in users or (role and user_role != role):
                    return jsonify({"error": "Unauthorized"}), 403
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except Exception:
                return jsonify({"error": "Token is invalid"}), 401
            return f(user, *args, **kwargs)
        return decorated
    return decorator

@app.route('/', methods=['GET'])
def home():
    return "API działa", 200

@app.route('/auth', methods=['POST'])
@cross_origin()
def auth():
    data = request.get_json() or {}
    login, password = data.get('login'), data.get('password')
    if not login or not password:
        return jsonify({"error": "Missing login or password"}), 400
    if login in users:
        if check_password_hash(users[login]['password_hash'], password):
            token = jwt.encode({'user': login, 'exp': datetime.utcnow() + timedelta(hours=12)}, app.config['SECRET_KEY'], algorithm="HS256")
            return jsonify({"message": "Logged in", "token": token}), 200
        return jsonify({"error": "Incorrect password"}), 401
    users[login] = {"password_hash": generate_password_hash(password), "role": "user"}
    scores[login] = 0
    token = jwt.encode({'user': login, 'exp': datetime.utcnow() + timedelta(hours=12)}, app.config['SECRET_KEY'], algorithm="HS256")
    return jsonify({"message": "Account created and logged in", "token": token}), 201

@app.route('/add_points', methods=['POST'])
@cross_origin()
@token_required()
def add_points(user):
    data = request.get_json() or {}
    target, points = data.get('user', user), data.get('points', 1)
    if target not in users or (target != user and users[user]['role'] != 'admin'):
        return jsonify({"error": "Unauthorized or user not found"}), 403
    scores[target] = scores.get(target, 0) + points
    return jsonify({"message": f"Added {points} points for {target}", "total": scores[target]}), 200

@app.route('/scoreboard', methods=['GET'])
@cross_origin()
def scoreboard():
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return jsonify(sorted_scores), 200

@app.route('/reset', methods=['POST'])
@cross_origin()
@token_required(role='admin')
def reset(_):
    scores.clear()
    return jsonify({"message": "Scores reset"}), 200

@app.route('/set_role', methods=['POST'])
@cross_origin()
@token_required(role='admin')
def set_role(_):
    data = request.get_json() or {}
    user, role = data.get('user'), data.get('role')
    if user not in users or role not in ['user', 'admin']:
        return jsonify({"error": "Invalid user or role"}), 400
    users[user]['role'] = role
    return jsonify({"message": f"Role of {user} set to {role}"}), 200

@app.route('/analyze_prompt', methods=['POST', 'OPTIONS'])
@cross_origin()
def analyze_prompt():
    if request.method == 'OPTIONS':
        return '', 200  # preflight CORS

    data = request.get_json() or {}
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({"error": "Prompt is missing"}), 400

    # Prosta logika przyznawania punktów na podstawie długości prompta
    points = len(prompt) % 10 + 1

    # Zaktualizuj wynik użytkownika jeśli jest token
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    total = points
    if token:
        try:
            data_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            user = data_token.get('user')
            if user in users:
                scores[user] = scores.get(user, 0) + points
                total = scores[user]
        except Exception:
            pass

    return jsonify({"points": points, "total": total}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)