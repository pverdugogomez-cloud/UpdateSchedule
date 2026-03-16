# Pozas - Control de Avance 🏗️

Aplicación Web Premium para el control de avance de obra en el Salar de Atacama. Diseñada para Jefes de Terreno y Programadores.

## 🚀 Despliegue

Esta aplicación está diseñada para ser ultra-ligera y flexible. Tienes dos formas de usarla:

### 1. GitHub Pages (Recomendado para visualización rápida)
1. Sube el archivo `index.html` a un repositorio de GitHub.
2. Ve a **Settings > Pages**.
3. Selecciona la rama `main` y guarda.
4. Tu app estará disponible en una URL pública de `github.io`.

### 2. Streamlit Cloud (Recomendado para integración con Datos)
1. Conecta tu repositorio de GitHub a [Streamlit Cloud](https://streamlit.io/cloud).
2. El archivo principal es `streamlit_app.py`.
3. Esta versión permite conectar directamente con **Google Sheets** (requiere configuración de Secrets).

## 🛠️ Tecnologías
- **Frontend:** React 18, Tailwind CSS, Lucide Icons, Chart.js.
- **Backend/Hosting:** Streamlit (Python) / GitHub Pages.
- **Persistencia:** LocalStorage (Offline mode) y Google Sheets (Streamlit only).

## 📊 Estructura del Maestro de Datos
La aplicación espera que Google Sheets tenga una tabla `MAESTRO_CONFIG` con las siguientes categorías:
- Área
- Sistema
- Familia
- Poza
- Equipo
- Actividad

---
Desarrollado para **Constructora Excon S.A.**
