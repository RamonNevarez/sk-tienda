from app import create_app, db
from app.models.category import Category
from app.models.product import Product
from app.models.product_variant import ProductVariant


products = [
    {
        'name': 'Bolso negro',
        'category': 'Bolsos',
        'price': 650,
        'wholesale_price': 580,
        'image_url': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',
        'description': 'Bolso de uso diario con cierre reforzado y amplio compartimento.',
        'variants': [
            {'name': 'Negro', 'image_url': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'},
            {'name': 'Marrón', 'image_url': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'},
            {'name': 'Beige', 'image_url': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'},
        ],
    },
    {
        'name': 'Cartera beige',
        'category': 'Carteras',
        'price': 300,
        'wholesale_price': 260,
        'image_url': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80',
        'description': 'Cartera elegante para uso diario, con estilo minimalista.',
        'variants': [
            {'name': 'Beige', 'image_url': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80'},
            {'name': 'Camel', 'image_url': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80'},
            {'name': 'Negro', 'image_url': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80'},
        ],
    },
    {
        'name': 'Billetera clásica',
        'category': 'Carteras',
        'price': 240,
        'wholesale_price': 210,
        'image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
        'description': 'Diseño clásico para llevar tus esenciales con orden.',
        'variants': [
            {'name': 'Negro', 'image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'},
            {'name': 'Miel', 'image_url': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'},
        ],
    },
]


app = create_app()

with app.app_context():
    if Product.query.count() == 0:
        category_cache = {}
        for item in products:
            category = category_cache.get(item['category'])
            if category is None:
                category = Category.query.filter_by(name=item['category']).first()
                if category is None:
                    category = Category(name=item['category'])
                    db.session.add(category)
                    db.session.flush()
                category_cache[item['category']] = category

            product = Product(
                name=item['name'],
                description=item['description'],
                price=item['price'],
                wholesale_price=item['wholesale_price'],
                wholesale_min_qty=6,
                image_url=item['image_url'],
                category_id=category.id,
                available=True,
            )
            db.session.add(product)
            db.session.flush()

            for variant in item['variants']:
                db.session.add(ProductVariant(
                    product_id=product.id,
                    name=variant['name'],
                    image_url=variant['image_url'],
                    price=item['price'],
                    wholesale_price=item['wholesale_price'],
                    wholesale_min_qty=6,
                    available=True,
                ))

        db.session.commit()
        print(f'Se cargaron {len(products)} productos de ejemplo.')
    else:
        for item in products:
            product = Product.query.filter_by(name=item['name']).first()
            if product and not product.variants:
                for variant in item['variants']:
                    db.session.add(ProductVariant(
                        product_id=product.id,
                        name=variant['name'],
                        image_url=variant['image_url'],
                        price=item['price'],
                        wholesale_price=item['wholesale_price'],
                        wholesale_min_qty=6,
                        available=product.available,
                    ))
        db.session.commit()
        print('Se completaron las variantes de los productos existentes.')
