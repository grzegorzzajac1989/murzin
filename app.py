from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'twoj_super_tajny_klucz'  # zmień na silny sekret

users = {}   # {login: {password_hash, role}}
scores = {}  # {login: punkty}

# Dekorator JWT i rola
def token_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
            if not token:
                return jsonify({"error": "Token is missing"}), 401
            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                current_user = data['user']
                user_role = users.get(current_user, {}).get('role')
                if current_user not in users:
                    return jsonify({"error": "User not found"}), 404
                if role and user_role not in role:
                    return jsonify({"error": "Unauthorized"}), 403
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except Exception:
                return jsonify({"error": "Token is invalid"}), 401
            return f(current_user, user_role, *args, **kwargs)
        return decorated
    return decorator

@app.route('/auth', methods=['POST'])
def auth():
    data = request.get_json()
    if not data or 'login' not in data or 'password' not in data:
        return jsonify({"error": "Missing login or password"}), 400
    login = data['login']
    password = data['password']
    if login in users:
        # logowanie
        if check_password_hash(users[login]['password_hash'], password):
            token = jwt.encode({
                'user': login,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            }, app.config['SECRET_KEY'], algorithm="HS256")
            return jsonify({"message": "Logged in", "token": token}), 200
        else:
            return jsonify({"error": "Wrong password"}), 401
    else:
        # rejestracja - nowy user dostaje role 'user'
        users[login] = {"password_hash": generate_password_hash(password), "role": "user"}
        scores[login] = 0
        token = jwt.encode({
            'user': login,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({"message": "Account created and logged in", "token": token}), 201

@app.route('/add_points', methods=['POST'])
@token_required(role=["user", "editor", "admin"])
def add_points(current_user, user_role):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON body"}), 400
    # Domyślnie punkty dodaje user sobie
    user = data.get('user', current_user)
    points = data.get('points', 1)
    # Jeśli user chce dodawać punkty innym, musi mieć rolę editor lub admin
    if user != current_user and user_role not in ['editor', 'admin']:
        return jsonify({"error": "Unauthorized to add points to others"}), 403
    if user not in users:
        return jsonify({"error": "User not found"}), 404
    scores[user] = scores.get(user, 0) + points
    return jsonify({"message": f"Added {points} points for {user}", "total": scores[user]}), 200

@app.route('/scoreboard', methods=['GET'])
def scoreboard():
    ranking = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return jsonify(ranking), 200

@app.route('/reset', methods=['POST'])
@token_required(role=['admin'])
def reset(current_user, user_role):
    scores.clear()
    return jsonify({"message": "Scores reset"}), 200

@app.route('/set_role', methods=['POST'])
@token_required(role=['admin'])
def set_role(current_user, user_role):
    data = request.get_json()
    if not data or 'user' not in data or 'role' not in data:
        return jsonify({"error": "Missing user or role"}), 400
    user = data['user']
    role = data['role']
    if user not in users:
        return jsonify({"error": "User not found"}), 404
    if role not in ['user', 'editor', 'admin']:
        return jsonify({"error": "Invalid role"}), 400
    users[user]['role'] = role
    return jsonify({"message": f"Role for {user} set to {role}"}), 200

@app.route('/', methods=['GET'])
def home():
    return "API działa", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000, debug=True)