# SK Bolsos Personalizados

Beta de catálogo de productos con variantes, carrito, pedidos por WhatsApp y panel administrativo.

## Arranque local

### Backend

```powershell
Set-Location "C:\SK-tienda\backend"
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe seed.py
.\.venv\Scripts\python.exe run.py
```

### Frontend

```powershell
Set-Location "C:\SK-tienda\frontend"
Copy-Item .env.example .env
$env:PATH += ";C:\Program Files\nodejs"
npm install
npm run dev
```

Catálogo: `http://localhost:5173/`  
Administración: `http://localhost:5173/admin`  
API: `http://localhost:5000/`

## Beta

Antes de publicar, configura secretos largos en `backend/.env`, cambia `CORS_ORIGINS` al dominio real y configura `VITE_API_URL` en el frontend con la URL pública de la API. No publiques `.env`, la base SQLite ni la carpeta `instance`.

En Render, agrega un Persistent Disk montado en `/var/data` y configura:

```env
DATABASE_URL=sqlite:////var/data/store.db
```

Sin Persistent Disk, SQLite puede perderse cuando Render reinicie o vuelva a desplegar el servicio.

Para servir el backend con Waitress:

```powershell
Set-Location "C:\SK-tienda\backend"
.\.venv\Scripts\waitress-serve.exe --listen=0.0.0.0:5000 wsgi:app
```

Validación local:

```powershell
Set-Location "C:\SK-tienda\frontend"
npm run lint
npm run build
```