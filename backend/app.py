import os
import unicodedata
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from datetime import datetime, timedelta
from flask_cors import CORS, cross_origin
from transformers import pipeline
import threading
import math
import re

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://murzing.onrender.com", "http://localhost:3000"]}})
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')

similarity_pipeline = pipeline("feature-extraction", model="prajjwal1/bert-tiny")

users, scores = {}, {}
scores_lock = threading.Lock()

presets = [
    {"prompt": "murzin", "points": 1},
    {"prompt": "murzin na rowerze jadacy bez trzymanki", "points": 50},
    {"prompt": "murzin w samochodzie", "points": 10},
    {"prompt": "murzin w słuchawkach z mikrofonem", "points": 30},
]

short_phrases = {
    "gang murzinow": 5,
    "goraca murzinka": 10,
    "wysoki murzin": 2,
    "murzin karzel": 2,
}

def normalize_text(text):
    text = text.lower()
    text = unicodedata.normalize('NFD', text)
    return ''.join(c for c in text if unicodedata.category(c) != 'Mn')

def get_embedding(text):
    emb = similarity_pipeline(text)[0]
    # Embedding shape: [1, seq_len, hidden_dim], take mean over tokens
    emb_vector = [sum(dim)/len(dim) for dim in zip(*emb)]
    return emb_vector

def cosine_similarity(vec1, vec2):
    dot = sum(a*b for a,b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a*a for a in vec1))
    norm2 = math.sqrt(sum(b*b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0
    return dot / (norm1 * norm2)

# Precompute embeddings for presets once
for preset in presets:
    preset['norm_prompt'] = normalize_text(preset['prompt'])
    preset['embedding'] = get_embedding(preset['norm_prompt'])

def get_preset_points(prompt):
    prompt_norm = normalize_text(prompt)
    total_points = 0

    # Sprawdzenie mnożnika (np. "2x murzin")
    pattern = re.compile(r'^(\d+)\s*x\s*(.+)$')
    match = pattern.match(prompt_norm)
    if match:
        multiplier = int(match.group(1))
        phrase = match.group(2).strip()

        points_for_phrase = 0
        # Dosłowne dopasowania w presety
        for preset in presets:
            if preset['norm_prompt'] in phrase:
                points_for_phrase += preset['points']
        # Dosłowne dopasowania w short phrases
        for phrase_sp, pts in short_phrases.items():
            if phrase_sp in phrase:
                points_for_phrase += pts
        # Embedding similarity tylko jeśli dosłowne dopasowania nie znaleziono
        if points_for_phrase == 0:
            phrase_emb = get_embedding(phrase)
            for preset in presets:
                sim = cosine_similarity(phrase_emb, preset['embedding'])
                if sim > 0.8:
                    points_for_phrase += preset['points']

        return multiplier * points_for_phrase

    # Bez mnożnika: najpierw dosłowne dopasowania
    for preset in presets:
        if preset['norm_prompt'] in prompt_norm:
            total_points += preset['points']

    for phrase, pts in short_phrases.items():
        if phrase in prompt_norm:
            total_points += pts

    # Jeśli brak dosłownych dopasowań, wtedy embedding similarity
    if total_points == 0:
        prompt_emb = get_embedding(prompt_norm)
        for preset in presets:
            sim = cosine_similarity(prompt_emb, preset['embedding'])
            if sim > 0.8:
                total_points += preset['points']

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
    try:
        data = request.get_json() or {}
        prompt = data.get('prompt', '').strip()
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

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