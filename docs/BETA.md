# Checklist de beta

## Configuración local

- [ ] Copiar `backend/.env.example` como `backend/.env`.
- [ ] Generar valores largos y aleatorios para `SECRET_KEY` y `JWT_SECRET_KEY`.
- [ ] Configurar `CORS_ORIGINS` con el dominio del frontend.
- [ ] Copiar `frontend/.env.example` como `frontend/.env`.
- [ ] Configurar `VITE_API_URL` con la URL pública de la API.
- [ ] Revisar `VITE_CLOUDINARY_CLOUD_NAME` y `VITE_CLOUDINARY_UPLOAD_PRESET`.

## Datos y administración

- [ ] Crear el usuario administrador.
- [ ] Ejecutar `seed.py` solo si se desean productos de ejemplo.
- [ ] Revisar productos, variantes, precios e imágenes.
- [ ] Probar una vista previa del inventario maestro.
- [ ] Probar una sincronización con una variante nueva.
- [ ] Confirmar que los productos ausentes no se eliminen.

## Pruebas públicas

- [ ] Abrir el catálogo desde móvil.
- [ ] Buscar por producto, categoría y variante.
- [ ] Agregar variantes distintas al carrito.
- [ ] Verificar precios mayoristas desde 6 unidades.
- [ ] Generar el mensaje de WhatsApp.
- [ ] Probar una variante sin imagen y comprobar el placeholder.
- [ ] Confirmar que `/admin` no aparece en el catálogo público.

## Publicación

- [ ] Servir el backend con Waitress, no con `debug=True`.
- [ ] Activar HTTPS.
- [ ] Configurar respaldos de SQLite o usar una base administrada.
- [ ] No publicar archivos `.env`, `*.db` ni la carpeta `instance`.
- [ ] Verificar que el hosting del frontend redirija `/admin` a `index.html`.