from app import db

STORE_CATEGORIES = ('Bolsos', 'Carteras', 'Tarjeteros', 'Accesorios')
CATEGORY_ALIASES = {
    'bolso': 'Bolsos',
    'cartera': 'Carteras',
    'tarjetero': 'Tarjeteros',
    'accesorio': 'Accesorios',
}


class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)

    products = db.relationship('Product', backref='category', lazy=True)
