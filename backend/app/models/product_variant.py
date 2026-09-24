from app import db


class ProductVariant(db.Model):
    __tablename__ = 'product_variants'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    price = db.Column(db.Float, nullable=False)
    wholesale_price = db.Column(db.Float, nullable=True)
    wholesale_min_qty = db.Column(db.Integer, nullable=False, default=6)
    available = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    product = db.relationship('Product', back_populates='variants')