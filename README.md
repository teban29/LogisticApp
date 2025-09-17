# Aplicacion Web de Logistica Integral

Este proyecto es una aplicación web logística desarrollada con **Django** en el backend y **React (Vite)** en el frontend. Su propósito es gestionar clientes, cargas, inventarios, envíos y más funcionalidades orientadas a empresas de logística y transporte de mercancías.

## 📥 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd <nombre-del-repositorio>

🐍 2. Configuración del Backend (Django)

Crear un entorno virtual:
python -m venv venv

Activar el entorno virtual:

En Windows:

venv\Scripts\activate

En Mac/Linux:

source venv/bin/activate

Instalar dependencias:
pip install -r requirements.txt

Ingresar al directorio del backend:
cd backend

Crear un superusuario para el panel de administración:
python manage.py createsuperuser

Levantar el servidor de desarrollo:
python manage.py runserver

👉 El backend estará disponible en http://localhost:8000

⚛️ 3. Configuración del Frontend (React + Vite)

Abrir otra terminal e ir al directorio del frontend:
cd frontend

Instalar dependencias de Node.js:
npm install

Crear un archivo .env en el directorio frontend/ con el siguiente contenido:

VITE_API_URL="http://localhost:8000"

⚠️ Asegúrate de que la URL coincida con la del backend (puerto 8000 por defecto en Django).

Ejecutar el servidor de desarrollo:
npm run dev

👉 El frontend estará disponible en la URL que indique la consola (normalmente http://localhost:5173
).
```

## ✅ Acceso al sistema

1. Ingresa al frontend en tu navegador.
2. Inicia sesión con el superusuario que creaste en el backend.

## 📌 Notas
Asegúrate de tener instalados:

Python 3.10+
Node.js 16+
npm

El backend y frontend deben estar corriendo en paralelo en dos terminales distintas.
