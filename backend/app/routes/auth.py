from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from app.models.user import User

auth_bp = Blueprint('auth', __name__)


@auth_bp.post('/login')
def login():
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'username y password son requeridos'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'credenciales inválidas'}), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={'username': user.username, 'role': user.role},
    )
    return jsonify({'access_token': access_token}), 200

