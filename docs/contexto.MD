# Contexto del proyecto — Catálogo y pedidos por WhatsApp

## 1. Objetivo

Desarrollar una aplicación web para un pequeño negocio que vende bolsos, carteras y accesorios personalizados.

El objetivo NO es construir una tienda electrónica completa.

La aplicación debe permitir que los clientes:

1. Entren mediante un enlace.
2. Vean los productos actualmente disponibles.
3. Consulten información e imágenes de los productos.
4. Agreguen productos a un carrito.
5. Vean el total de su pedido.
6. Generen un mensaje de WhatsApp con el detalle del pedido y el total.
7. Envíen manualmente ese mensaje por WhatsApp.

El propietario del negocio recibirá el pedido por WhatsApp y decidirá manualmente cómo manejar disponibilidad, prioridad y entrega.

---

# 2. Alcance actual

## Sí necesitamos

* Catálogo de productos.
* Categorías.
* Imágenes de productos.
* Posibilidad de agregar variantes de colores a ciertos productos (opcional).
* Precio.
* Disponibilidad de producto.
* Página de detalle de producto.
* Carrito.
* Cantidades en carrito.
* Manejo de precios de mayoreo y menudeo. (mostrar ambos precios y tomar el de mayoreo cuando son 6 piezas o más)
* Cálculo de subtotales y total.
* Generación de mensaje de WhatsApp.
* Panel administrativo.
* Inicio de sesión del administrador.
* Alta, edición y baja de productos.
* Activar/desactivar disponibilidad.
* Administración de categorías.
* Persistencia de productos y pedidos.
* Historial básico de pedidos, aunque inicialmente el pedido se gestione por WhatsApp.

## NO necesitamos actualmente

* Pagos en línea.
* Mercado Pago / Stripe / PayPal.
* Cuentas de clientes.
* Registro de clientes.
* Contraseñas para clientes.
* Inventario numérico.
* Reservas automáticas.
* Sistema de "primero en llegar, primero en comprar".
* Automatización de conflictos de disponibilidad.
* Integración con WhatsApp Business API.
* Chatbot de WhatsApp.
* Automatización de envíos.
* Cálculo automático de tarifas de envío.
* Facturación electrónica.
* Cupones.
* Puntos/recompensas.
* App móvil nativa.
* Microservicios.
* Kubernetes.
* Redis.
* RabbitMQ.

La aplicación debe mantenerse simple.

---

# 3. Flujo principal del cliente

```text
Cliente
   │
   ▼
Enlace del sitio
   │
   ▼
Catálogo
   │
   ├── Filtrar por categoría
   │
   ├── Ver producto
   │
   └── Agregar al carrito
             │
             ▼
          Carrito
             │
             ├── Modificar cantidades
             ├── Eliminar productos
             └── Ver total
                     │
                     ▼
             Generar pedido
                     │
                     ▼
               WhatsApp
                     │
                     ▼
          Cliente presiona "Enviar"
                     │
                     ▼
             Negocio recibe pedido
```

Ejemplo del mensaje generado:

```text
Hola, quiero realizar el siguiente pedido:

• 1 × Bolso negro — $650
• 2 × Cartera beige — $300

Total: $1,250
```

El número de WhatsApp del negocio será configurable.

La aplicación debe generar una URL del tipo:

```text
https://wa.me/NUMERO?text=MENSAJE_CODIFICADO
```

No se utilizará inicialmente la API de WhatsApp.

---

# 4. Modelo de disponibilidad

Los productos NO tienen inventario numérico.

Cada producto solamente tiene un estado:

```text
available = true
available = false
```

Ejemplo:

```text
Bolso negro
available = true
```

Si está disponible:

* aparece en el catálogo público;
* puede agregarse al carrito.

Si deja de estar disponible:

```text
available = false
```

Entonces:

* deja de aparecer en el catálogo público;
* no debe poder agregarse a nuevos carritos.

La decisión sobre qué cliente recibe un producto cuando existen varios interesados se realiza manualmente fuera del sistema.

---

# 5. Arquitectura

La aplicación será un monorepo:

```text
tienda/
│
├── frontend/
│
├── backend/
│
├── docs/
│   └── CONTEXTO.md
│
├── README.md
│
└── .gitignore
```

Arquitectura general:

```text
                    INTERNET
                       │
                       ▼
              ┌─────────────────┐
              │    FRONTEND     │
              │                 │
              │ React + Vite    │
              │ MUI             │
              │                 │
              │ Catálogo        │
              │ Productos       │
              │ Carrito         │
              │ Administración  │
              └────────┬────────┘
                       │
                    HTTPS/REST
                       │
                       ▼
              ┌─────────────────┐
              │     BACKEND     │
              │                 │
              │ Flask           │
              │ SQLAlchemy      │
              │ JWT             │
              │                 │
              │ Auth            │
              │ Products        │
              │ Categories      │
              │ Orders          │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │    DATABASE     │
              │                 │
              │ SQLite          │
              │                 │
              │ Users           │
              │ Products        │
              │ Categories      │
              │ Orders          │
              │ OrderItems      │
              └─────────────────┘
```

---

# 6. Tecnologías

## Frontend

* React
* Vite
* Material UI (MUI)
* JavaScript inicialmente
* React Router
* Fetch o Axios para comunicación con API

No introducir Redux u otro gestor de estado global inicialmente.

El carrito puede manejarse con React Context + localStorage si resulta necesario.

## Backend

* Python
* Flask
* Flask-SQLAlchemy / SQLAlchemy
* JWT
* Werkzeug para hashing de contraseñas
* Flask-CORS

## Base de datos

Inicialmente:

```text
SQLite
```

No utilizar PostgreSQL mientras SQLite sea suficiente.

La aplicación debe diseñarse de manera que posteriormente sea posible migrar a PostgreSQL.

## Control de versiones

Git.

Repositorio remoto:

* GitHub o Azure DevOps.

---

# 7. Estructura del frontend

Propuesta inicial:

```text
frontend/
├── public/
│
├── src/
│   ├── components/
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── ProductCard/
│   │   ├── ProductGrid/
│   │   ├── ProductDetail/
│   │   ├── CategoryFilter/
│   │   ├── Cart/
│   │   ├── CartItem/
│   │   ├── CartSummary/
│   │   └── WhatsAppButton/
│   │
│   ├── pages/
│   │   ├── Home/
│   │   ├── Products/
│   │   ├── Product/
│   │   ├── Cart/
│   │   ├── AdminLogin/
│   │   ├── Admin/
│   │   ├── AdminProducts/
│   │   └── AdminOrders/
│   │
│   ├── layouts/
│   │   ├── PublicLayout/
│   │   └── AdminLayout/
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── productService.js
│   │   ├── categoryService.js
│   │   ├── authService.js
│   │   └── orderService.js
│   │
│   ├── hooks/
│   │
│   ├── context/
│   │   ├── CartContext.jsx
│   │   └── AuthContext.jsx
│   │
│   ├── types/
│   │
│   ├── App.jsx
│   └── main.jsx
│
└── package.json
```

Esta estructura es una propuesta inicial. No crear carpetas o abstracciones innecesarias si el proyecto todavía no las necesita.

---

# 8. Rutas públicas del frontend

```text
/
```

Página principal / catálogo.

```text
/products
```

Catálogo completo.

```text
/product/:id
```

Detalle de producto.

```text
/cart
```

Carrito.

---

# 9. Rutas administrativas

```text
/admin/login
```

Inicio de sesión.

```text
/admin
```

Dashboard.

```text
/admin/products
```

Lista de productos.

```text
/admin/products/new
```

Crear producto.

```text
/admin/products/:id
```

Editar producto.

```text
/admin/orders
```

Pedidos.

---

# 10. Estructura del backend

```text
backend/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── extensions.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── category.py
│   │   ├── order.py
│   │   └── order_item.py
│   │
│   ├── routes/
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── categories.py
│   │   └── orders.py
│   │
│   └── services/
│       ├── product_service.py
│       ├── order_service.py
│       └── whatsapp_service.py
│
├── migrations/
├── tests/
├── requirements.txt
└── run.py
```

No convertir el backend en una arquitectura excesivamente compleja.

---

# 11. Base de datos

## users

```text
id
username
password_hash
role
created_at
```

Roles inicialmente:

```text
admin
```

Los clientes no necesitan cuentas.

---

## categories

```text
id
name
description
```

---

## products

```text
id
name
description
price
image_url
category_id
available
created_at
updated_at
```

Relación:

```text
Category 1 ───── N Products
```

---

## orders

```text
id
customer_name
customer_phone
total
status
created_at
```

El nombre y teléfono pueden ser opcionales inicialmente.

Estados sugeridos:

```text
pending
confirmed
completed
cancelled
```

---

## order_items

```text
id
order_id
product_id
product_name
unit_price
quantity
subtotal
```

Es importante guardar:

```text
product_name
unit_price
```

dentro de `order_items`.

Esto permite conservar el historial correctamente aunque posteriormente cambie el nombre o precio del producto.

Ejemplo:

```text
Producto actualmente:
Bolso negro
$700
```

Pero una orden histórica pudo haber sido:

```text
Bolso negro
$650
```

El pedido debe conservar los $650 originales.

---

# 12. API inicial

## Productos

```http
GET /api/products
```

Obtener productos disponibles.

```http
GET /api/products/:id
```

Obtener producto.

```http
POST /api/products
```

Crear producto.

Requiere autenticación.

```http
PUT /api/products/:id
```

Editar producto.

Requiere autenticación.

```http
PATCH /api/products/:id/availability
```

Cambiar disponibilidad.

Requiere autenticación.

---

## Categorías

```http
GET /api/categories
```

```http
POST /api/categories
```

```http
PUT /api/categories/:id
```

```http
DELETE /api/categories/:id
```

Las operaciones de modificación requieren autenticación.

---

## Autenticación

```http
POST /api/auth/login
```

Respuesta:

```json
{
  "access_token": "..."
}
```

Los endpoints administrativos protegidos utilizarán:

```http
Authorization: Bearer <token>
```

---

# 13. Seguridad

El backend nunca debe confiar en información crítica enviada por el frontend.

Por ejemplo, el frontend puede enviar:

```json
{
  "product_id": 10,
  "quantity": 2
}
```

El backend debe consultar el precio real de la base de datos.

No confiar en:

```json
{
  "product_id": 10,
  "price": 1
}
```

El precio siempre debe determinarse desde el backend.

Las contraseñas deben almacenarse utilizando hashing.

Nunca almacenar:

```text
password = "123456"
```

Utilizar `password_hash`.

Los secretos y claves JWT deben estar en variables de entorno.

Nunca subir `.env` al repositorio.

Utilizar HTTPS en producción.

Configurar CORS correctamente.

---

# 14. Carrito

El carrito inicialmente puede existir completamente en el navegador.

Ejemplo:

```javascript
[
  {
    productId: 1,
    name: "Bolso negro",
    price: 650,
    quantity: 1
  },
  {
    productId: 2,
    name: "Cartera beige",
    price: 300,
    quantity: 2
  }
]
```

Debe permitir:

* agregar producto;
* aumentar cantidad;
* disminuir cantidad;
* eliminar producto;
* vaciar carrito;
* calcular subtotal;
* calcular total.

No es necesario guardar el carrito en la base de datos.

Puede utilizarse `localStorage` para conservarlo si el cliente recarga la página.

---

# 15. Generación del pedido de WhatsApp

El frontend debe generar un mensaje similar a:

```text
Hola, quiero realizar el siguiente pedido:

• 1 × Bolso negro — $650
• 2 × Cartera beige — $300

Total: $1,250
```

Después debe codificar el mensaje para URL y abrir:

```text
https://wa.me/NUMERO?text=MENSAJE
```

WhatsApp se encarg
