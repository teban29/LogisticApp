# Aplicacion Web de Logistica Integral 

Este proyecto es una aplicación web logística desarrollada con **Django** en el backend y **React (Vite)** en el frontend. Su propósito es gestionar clientes, cargas, inventarios, envíos y más funcionalidades orientadas a empresas de logística y transporte de mercancías.


## 📦 Estructura del Proyecto


## 📥 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd <nombre-del-repositorio>

## 🐍 2. Configuración del Backend (Django)
1. Crear entorno virtual
```bash
python -m venv venv

2.	Activar el entorno virtual:
	•	En Windows:
    ```bash
    venv\Scripts\activate

	•	En Mac/Linux:
    ```bash
    source venv/bin/activate

3.	Instalar dependencias:

```bash
pip install -r requirements.txt

4.	Ingresar al directorio del backend:
```bash
cd backend

5.	Crear un superusuario para el panel de administración:
```bash
python manage.py createsuperuser

6.	Levantar el servidor de desarrollo:
```bash
python manage.py runserver

##⚛️ 3. Configuración del Frontend (React + Vite)

1.	Abrir otra terminal e ir al directorio del frontend:
```bash
cd frontend

2.	Instalar dependencias de Node.js:
```bash
npm install

3.	Crear un archivo .env en el directorio frontend/ con el siguiente contenido:

VITE_API_URL="http://localhost:8000"

⚠️ Asegúrate de que la URL coincida con la del backend (puerto 8000 por defecto en Django).

4.	Ejecutar el servidor de desarrollo:
```bash
npm run dev

👉 El frontend estará disponible en la URL que indique la consola (normalmente http://localhost:5173).


