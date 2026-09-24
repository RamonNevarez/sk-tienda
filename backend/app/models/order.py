from app import db


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(120), nullable=True)
    customer_phone = db.Column(db.String(40), nullable=True)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(40), default='pending', nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    items = db.relationship('OrderItem', backref='order', lazy=True)
