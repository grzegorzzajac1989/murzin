from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps

app = Flask(__name__)
app.config['SECRET_KEY'] = 'twoj_super_tajny_klucz'  # Zmien na dlugi, losowy secret

users = {}
scores = {}

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = data['user']
            if current_user not in users:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except Exception:
            return jsonify({'error': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

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
            token = jwt.encode({'user': login, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, app.config['SECRET_KEY'], algorithm='HS256')
            return jsonify({"message": "Logged in", "token": token}), 200
        else:
            return jsonify({"error": "Wrong password"}), 401
    else:
        # Rejestracja
        users[login] = {"password_hash": generate_password_hash(password)}
        scores[login] = 0
        token = jwt.encode({'user': login, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({"message": "Account created and logged in", "token": token}), 201

@app.route('/add_points', methods=['POST'])
@token_required
def add_points(current_user):
    data = request.get_json()
    points = data.get('points', 1)

    scores[current_user] = scores.get(current_user, 0) + points
    return jsonify({"message": f"Added {points} points for {current_user}", "total": scores[current_user]}), 200

@app.route('/scoreboard', methods=['GET'])
def scoreboard():
    ranking = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return jsonify(ranking), 200

@app.route('/reset', methods=['POST'])
@token_required
def reset(current_user):
    # Reset scores tylko dla administratora - tu np. login = 'admin'
    if current_user != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    for key in scores.keys():
        scores[key] = 0
    return jsonify({"message": "Scores reset"}), 200

@app.route('/', methods=['GET'])
def home():
    return "API dziala", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000, debug=True)