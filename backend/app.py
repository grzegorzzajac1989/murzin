import os
import unicodedata
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from datetime import datetime, timedelta
from flask_cors import CORS, cross_origin
import threading

from data.short_phrases import short_phrases as imported_short_phrases
from data.synonyms import synonimy_goracy, synonimy_murzin

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://murzing.onrender.com", "http://localhost:3000"]}})
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')

users, scores = {}, {}
scores_lock = threading.Lock()

variants = {**{w: "goracy" for w in synonimy_goracy}, **{w: "murzin" for w in synonimy_murzin}}

def normalize_text(text: str) -> str:
    text = text.lower()
    text = unicodedata.normalize('NFD', text)
    return ''.join(c for c in text if unicodedata.category(c) != 'Mn')

def correct_variants(text: str) -> str:
    words = text.split()
    return ' '.join(variants.get(word, word) for word in words)

short_phrases = {normalize_text(k): v for k, v in imported_short_phrases.items()}

def get_preset_points(prompt: str) -> int:
    prompt_norm = normalize_text(prompt)
    prompt_norm = correct_variants(prompt_norm)

    phrase_count = {}
    words = prompt_norm.split()

    # Lista fraz już przypisanych, aby uniknąć nakładania się
    assigned_spans = []

    for n in range(len(words), 0, -1):  # od dłuższych fraz do krótszych
        for i in range(len(words) - n + 1):
            phrase = ' '.join(words[i:i + n])
            if phrase in short_phrases:
                # Sprawdź, czy zakres słów nie jest już pokryty przez dłuższą frazę
                overlap = False
                for start, end in assigned_spans:
                    if not (i + n - 1 < start or i > end):  # zachodzi nakładanie
                        overlap = True
                        break
                if not overlap:
                    phrase_count[phrase] = phrase_count.get(phrase, 0) + 1
                    assigned_spans.append((i, i + n - 1))

    total_points = 0
    for phrase, count in phrase_count.items():
        total_points += short_phrases[phrase] * count

    return total_points

def token_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = request.headers.get('Authorization', '').replace('Bearer ', '')
            if not token:
                return jsonify({"error": "Token is missing"}), 401
            try:
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                user = data['user']
                user_role = users.get(user, {}).get('role')
                if user not in users or (role and user_role != role):
                    return jsonify({"error": "Unauthorized"}), 403
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except Exception as e:
                print("Token decode error:", e)
                return jsonify({"error": "Token is invalid"}), 401
            return f(user, *args, **kwargs)
        return decorated
    return decorator

@app.route('/', methods=['GET'])
def home():
    return "API działa", 200

@app.route('/auth', methods=['POST'])
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
    with scores_lock:
        scores[login] = 0
    token = jwt.encode({'user': login, 'exp': datetime.utcnow() + timedelta(hours=12)}, app.config['SECRET_KEY'], algorithm="HS256")
    return jsonify({"message": "Account created and logged in", "token": token}), 201

@app.route('/add_points', methods=['POST'])
@token_required()
def add_points(user):
    data = request.get_json() or {}
    target, points = data.get('user', user), data.get('points', 1)
    if target not in users or (target != user and users[user]['role'] != 'admin'):
        return jsonify({"error": "Unauthorized or user not found"}), 403
    with scores_lock:
        scores[target] = scores.get(target, 0) + points
        total = scores[target]
    return jsonify({"message": f"Added {points} points for {target}", "total": total}), 200

@app.route('/scoreboard', methods=['GET'])
def scoreboard():
    with scores_lock:
        sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return jsonify([{"user": u, "score": s} for u, s in sorted_scores]), 200

@app.route('/reset', methods=['POST'])
@token_required(role='admin')
def reset(_):
    with scores_lock:
        scores.clear()
    return jsonify({"message": "Scores reset"}), 200

@app.route('/set_role', methods=['POST'])
@token_required(role='admin')
def set_role(_):
    data = request.get_json() or {}
    user, role = data.get('user'), data.get('role')
    if user not in users or role not in ['user', 'admin']:
        return jsonify({"error": "Invalid user or role"}), 400
    users[user]['role'] = role
    return jsonify({"message": f"Role of {user} set to {role}"}), 200

@app.route('/analyze_prompt', methods=['POST'])
@cross_origin(origin=["https://murzing.onrender.com", "http://localhost:3000"])
@token_required()
def analyze_prompt(user):
    data = request.get_json() or {}
    prompt = data.get('prompt', '').strip()
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400
    try:
        points_earned = get_preset_points(prompt)
        with scores_lock:
            scores[user] = scores.get(user, 0) + points_earned
            total = scores[user]
        message = f"Prompt analyzed! You earned {points_earned} points. Total: {total}"
        return jsonify({"message": message, "points": points_earned, "total": total}), 200
    except Exception as e:
        print("Analyze prompt error:", e)
        return jsonify({"error": "Error analyzing prompt"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)