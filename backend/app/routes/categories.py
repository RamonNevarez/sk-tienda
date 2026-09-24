from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.category import Category

categories_bp = Blueprint('categories', __name__)


@categories_bp.get('')
def get_categories():
    categories = Category.query.order_by(Category.id.asc()).all()
    return jsonify([
        {
            'id': c.id,
            'name': c.name,
            'description': c.description,
        }
        for c in categories
    ])


@categories_bp.post('')
@jwt_required()
def create_category():
    data = request.get_json(silent=True) or {}
    name = data.get('name')
    description = data.get('description')

    if not name:
        return jsonify({'error': 'El nombre es requerido'}), 400

    category = Category(name=name, description=description)
    db.session.add(category)
    db.session.commit()

    return jsonify({'id': category.id, 'name': category.name, 'description': category.description}), 201


@categories_bp.put('/<int:category_id>')
@jwt_required()
def update_category(category_id):
    category = Category.query.get_or_404(category_id)
    data = request.get_json(silent=True) or {}

    category.name = data.get('name', category.name)
    category.description = data.get('description', category.description)
    db.session.commit()

    return jsonify({'id': category.id, 'name': category.name, 'description': category.description})


@categories_bp.delete('/<int:category_id>')
@jwt_required()
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Categoría eliminada'}), 200
