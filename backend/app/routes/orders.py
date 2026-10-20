from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.category import CATEGORY_ALIASES, DIJE_OPTIONS

orders_bp = Blueprint('orders', __name__)


@orders_bp.get('')
@jwt_required()
def get_orders():
    orders = Order.query.order_by(Order.id.desc()).all()
    result = []
    for order in orders:
        result.append({
            'id': order.id,
            'customer_name': order.customer_name,
            'customer_phone': order.customer_phone,
            'total': order.total,
            'status': order.status,
            'created_at': order.created_at.isoformat() if order.created_at else None,
            'items': [
                {
                    'id': item.id,
                    'product_id': item.product_id,
                    'variant_id': item.variant_id,
                    'product_name': item.product_name,
                    'variant_name': item.variant_name,
                    'selected_letter': item.selected_letter,
                    'selected_dije': item.selected_dije,
                    'color': item.color,
                    'unit_price': item.unit_price,
                    'quantity': item.quantity,
                    'subtotal': item.subtotal,
                }
                for item in order.items
            ],
        })
    return jsonify(result)


@orders_bp.post('')
def create_order():
    data = request.get_json(silent=True) or {}
    items = data.get('items', [])

    if not items:
        return jsonify({'error': 'Debe incluir al menos un item'}), 400

    total = 0.0
    order = Order(
        customer_name=data.get('customer_name'),
        customer_phone=data.get('customer_phone'),
        total=0,
        status='pending',
    )
    db.session.add(order)
    db.session.flush()

    prepared_items = []
    wholesale_quantities = {}
    for item in items:
        product_id = item.get('product_id')
        variant_id = item.get('variant_id')
        try:
            quantity = int(item.get('quantity', 0))
        except (TypeError, ValueError):
            quantity = 0

        product = db.session.get(Product, product_id) if product_id else None
        variant = db.session.get(ProductVariant, variant_id) if variant_id else None
        selected_letter = str(item.get('selected_letter') or '').strip().upper() or None
        selected_dije = str(item.get('selected_dije') or '').strip() or None
        category_name = product.category.name if product else None
        category_name = CATEGORY_ALIASES.get(category_name.casefold(), category_name) if category_name else None
        is_letter_product = bool(
            product
            and category_name == 'Accesorios'
            and product.name.strip().casefold().startswith('letra')
        )
        is_dije_product = bool(
            product
            and category_name == 'Accesorios'
            and product.name.strip().casefold().startswith('dije')
        )
        valid_letters = set('ABCDEFGHIJKLMNÑOPQRSTUVWXYZ')

        if (
            not product
            or not variant
            or variant.product_id != product.id
            or not product.available
            or not variant.available
            or quantity <= 0
            or (is_letter_product and selected_letter not in valid_letters)
            or (selected_letter is not None and (not is_letter_product or selected_letter not in valid_letters))
            or (is_dije_product and selected_dije not in DIJE_OPTIONS)
            or (selected_dije is not None and (not is_dije_product or selected_dije not in DIJE_OPTIONS))
        ):
            db.session.rollback()
            return jsonify({'error': 'El pedido contiene un producto inválido o no disponible'}), 400

        category_id = product.category_id
        if product.wholesale_enabled:
            wholesale_quantities[category_id] = wholesale_quantities.get(category_id, 0) + quantity
        prepared_items.append((product, variant, quantity, selected_letter, selected_dije))

    for product, variant, quantity, selected_letter, selected_dije in prepared_items:
        wholesale_min_qty = product.category.wholesale_min_qty or 6
        unit_price = variant.price
        category_quantity = wholesale_quantities.get(product.category_id, 0)
        if product.wholesale_enabled and variant.wholesale_price is not None and category_quantity >= wholesale_min_qty:
            unit_price = variant.wholesale_price

        subtotal = unit_price * quantity
        total += subtotal

        db.session.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            variant_id=variant.id,
            product_name=product.name,
            variant_name=variant.name,
            selected_letter=selected_letter,
            selected_dije=selected_dije,
            unit_price=unit_price,
            quantity=quantity,
            subtotal=subtotal,
        ))

    order.total = total
    db.session.commit()

    return jsonify({
        'id': order.id,
        'customer_name': order.customer_name,
        'customer_phone': order.customer_phone,
        'total': order.total,
        'status': order.status,
    }), 201
