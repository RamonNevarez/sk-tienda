from app import db

STORE_CATEGORIES = ('Bolsos', 'Cosmetiqueras', 'Tarjeteros', 'Accesorios')
CATEGORY_ALIASES = {
    'bolso': 'Bolsos',
    'cartera': 'Cosmetiqueras',
    'carteras': 'Cosmetiqueras',
    'tarjetero': 'Tarjeteros',
    'accesorio': 'Accesorios',
}
DIJE_OPTIONS = (
    'Abeja',
    'Beetle',
    'Buttlerfly',
    'Lucky Clover',
    'Lucky Star',
    'Luna',
    'Mano de Fatima',
    'Ojo',
    'Teddy Bear',
)


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    wholesale_min_qty = db.Column(db.Integer, nullable=False, default=6)

    products = db.relationship('Product', backref='category', lazy=True)
