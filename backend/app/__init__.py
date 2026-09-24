from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from sqlalchemy import inspect, text
from dotenv import load_dotenv
import os

from app.config import Config


# Extensiones

db = SQLAlchemy()
jwt = JWTManager()


def _ensure_sqlite_columns():
    if not db.engine.url.drivername.startswith('sqlite'):
        return

    columns_by_table = {
        'products': {
            'wholesale_price': 'FLOAT',
            'wholesale_min_qty': 'INTEGER NOT NULL DEFAULT 6',
            'colors': 'JSON NOT NULL DEFAULT \'[]\'',
        },
        'order_items': {
            'color': 'VARCHAR(80)',
            'variant_id': 'INTEGER',
            'variant_name': 'VARCHAR(150)',
        },
    }

    inspector = inspect(db.engine)
    with db.engine.begin() as connection:
        for table_name, columns in columns_by_table.items():
            existing_columns = {column['name'] for column in inspector.get_columns(table_name)}
            for column_name, definition in columns.items():
                if column_name not in existing_columns:
                    connection.execute(text(f'ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}'))


def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r'/api/*': {'origins': app.config['CORS_ORIGINS']}})
    db.init_app(app)
    jwt.init_app(app)

    with app.app_context():
        from app.models.user import User
        from app.models.category import Category
        from app.models.product import Product
        from app.models.product_variant import ProductVariant
        from app.models.order import Order
        from app.models.order_item import OrderItem

        db.create_all()
        _ensure_sqlite_columns()

    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.categories import categories_bp
    from app.routes.orders import orders_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')

    @app.get('/')
    def home():
        return {'message': 'Tienda API funcionando'}

    return app
