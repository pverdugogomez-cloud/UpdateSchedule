import streamlit as st
import streamlit.components.v1 as components
import os

# Configuración de página
st.set_page_config(
    page_title="Pozas - Control de Avance",
    page_icon="🏗️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Título oculto para SEO/Streamlit
st.markdown("<h1 style='display:none;'>Pozas Control</h1>", unsafe_allow_html=True)

# Lógica de conexión a Google Sheets (Opcional)
# Si el usuario configura secrets, se activa la carga real
def load_data_from_gsheets():
    try:
        from st_gsheets_connection import GSheetsConnection
        conn = st.connection("gsheets", type=GSheetsConnection)
        # Aquí se leería el Maestro de Datos
        # df = conn.read(worksheet="MAESTRO_CONFIG")
        # return df.to_json()
        return None
    except:
        return None

# Leer el archivo index.html
def get_html():
    with open("index.html", "r", encoding="utf-8") as f:
        return f.read()

# Inyectar el HTML en Streamlit
# Usamos un componente de altura completa
html_content = get_html()

# Mostrar la app
components.html(html_content, height=1000, scrolling=True)

# Barra lateral con instrucciones de despliegue
with st.sidebar:
    st.title("Configuración")
    st.info("""
    Esta aplicación está funcionando en modo **Premium React**. 
    
    Para conectar con **Google Sheets**:
    1. Ve a la consola de Streamlit Cloud.
    2. Agrega tus credenciales en 'Secrets'.
    3. Vincula el ID de tu planilla.
    """)
    if st.button("Limpiar Caché Local"):
        st.cache_data.clear()
        st.success("Caché limpia")
