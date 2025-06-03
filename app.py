import os
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from datetime import datetime, timedelta

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'zmien_to_na_cos_silnego')

users = {}   # {login: {"password_hash": ..., "role": "user"/"admin"}}
scores = {}  # {login: points}

def token_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            auth_header = request.headers.get('Authorization', None)
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

            if not token:
                return jsonify({"error": "Token is missing"}), 401

            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                current_user = data['user']
                user_role = users.get(current_user, {}).get('role')
                if current_user not in users:
                    return jsonify({"error": "User not found"}), 401
                if role and user_role != role:
                    return jsonify({"error": "Unauthorized"}), 403
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except Exception:
                return jsonify({"error": "Token is invalid"}), 401

            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

@app.route('/', methods=['GET'])
def home():
    return "API dziala", 200

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
            token = jwt.encode(
                {'user': login, 'exp': datetime.utcnow() + timedelta(hours=12)},
                app.config['SECRET_KEY'],
                algorithm="HS256"
            )
            return jsonify({"message": "Logged in", "token": token}), 200
        else:
            return jsonify({"error": "Incorrect password"}), 401
    else:
        # Registration (default role = user)
        users[login] = {
            "password_hash": generate_password_hash(password),
            "role": "user"
        }
        scores[login] = 0
        token = jwt.encode(
            {'user': login, 'exp': datetime.utcnow() + timedelta(hours=12)},
            app.config['SECRET_KEY'],
            algorithm="HS256"
        )
        return jsonify({"message": "Account created and logged in", "token": token}), 201

@app.route('/add_points', methods=['POST'])
@token_required()
def add_points(current_user):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON data"}), 400

    # If admin and 'user' specified in data, add points to that user
    # else add points to current_user
    target_user = data.get('user', current_user)
    points = data.get('points', 1)

    if target_user not in users:
        return jsonify({"error": "User not found"}), 404

    # Only admin can add points for others
    if target_user != current_user and users[current_user]['role'] != 'admin':
        return jsonify({"error": "Unauthorized to add points for other users"}), 403

    scores[target_user] = scores.get(target_user, 0) + points
    return jsonify({"message": f"Added {points} points for {target_user}", "total": scores[target_user]}), 200

@app.route('/scoreboard', methods=['GET'])
@token_required()
def scoreboard(current_user):
    ranking = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return jsonify(ranking), 200

@app.route('/reset', methods=['POST'])
@token_required(role='admin')
def reset(current_user):
    scores.clear()
    return jsonify({"message": "Scores reset"}), 200

@app.route('/set_role', methods=['POST'])
@token_required(role='admin')
def set_role(current_user):
    data = request.get_json()
    if not data or 'user' not in data or 'role' not in data:
        return jsonify({"error": "Missing 'user' or 'role' in request"}), 400

    user = data['user']
    role = data['role']

    if user not in users:
        return jsonify({"error": "User not found"}), 404
    if role not in ['user', 'admin']:
        return jsonify({"error": "Invalid role"}), 400

    users[user]['role'] = role
    return jsonify({"message": f"Role of {user} set to {role}"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)