from app import db


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    wholesale_price = db.Column(db.Float, nullable=True)
    wholesale_min_qty = db.Column(db.Integer, nullable=False, default=6)
    colors = db.Column(db.JSON, nullable=False, default=list)
    image_url = db.Column(db.String(255), nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    available = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    variants = db.relationship('ProductVariant', back_populates='product', cascade='all, delete-orphan', lazy=True)
