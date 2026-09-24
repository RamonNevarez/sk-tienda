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

Para usar Neon, instala el driver incluido en `requirements.txt` y configura en Render la variable `DATABASE_URL` con el connection string completo de Neon. No lo publiques en GitHub ni lo compartas en el chat. El backend convertirá automáticamente `postgresql://` al driver compatible.

Ejemplo de formato, usando valores ficticios:

```env
DATABASE_URL=postgresql://usuario:contraseña@ep-ejemplo.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Si mantienes SQLite, agrega un Persistent Disk montado en `/var/data` y configura:

```env
DATABASE_URL=sqlite:////var/data/store.db
```

Sin Persistent Disk, SQLite puede perderse cuando Render reinicie o vuelva a desplegar el servicio. Con Neon ya no necesitas configurar ese disco para la base de datos.

Para servir el backend con Waitress:

```powershell
Set-Location "C:\SK-tienda\backend"
.\.venv\Scripts\waitress-serve.exe --listen=0.0.0.0:5000 wsgi:app
```

### Administradores

El registro público está deshabilitado. Para crear un administrador localmente o desde el Shell de Render:

```bash
python manage.py create-admin
```

El comando solicita la contraseña de forma interactiva y funciona contra la base configurada en `DATABASE_URL`.

Validación local:

```powershell
Set-Location "C:\SK-tienda\frontend"
npm run lint
npm run build
```