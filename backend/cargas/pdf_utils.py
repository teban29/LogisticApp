# cargas/pdf_utils.py
import os
from io import BytesIO
from collections import defaultdict

# Django imports
from django.conf import settings
from django.utils import timezone

# Third-party imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

def generate_consolidado_pdf(carga):
    try:
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        width, height = letter
        margin_horizontal = 50
        
        # Logo de la empresa
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'logo_empresa.png')
        
        # Dibujar primera página
        draw_consolidado_header(c, carga, width, height, margin_horizontal, logo_path, 1)
        
        # Obtener items agrupados
        grupos_items = obtener_items_agrupados_carga(carga)
        
        # Preparar datos de la tabla AGRUPADOS con columnas separadas
        data = []
        total_unidades = 0
        
        for grupo in grupos_items:
            # Formato: "Producto" - "Cantidad" - "SKU"
            data.append([
                grupo['producto_nombre'], 
                str(grupo['cantidad']), 
                grupo['producto_sku'] or 'N/A'
            ])
            total_unidades += grupo['cantidad']
        
        # Dibujar tabla con margen superior y centrada
        draw_consolidado_table(c, data, width, height, margin_horizontal, carga, logo_path, total_unidades)
        
        # Sección de firmas - QUIEN ENTREGA
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin_horizontal, 200, "Quien Entrega:")
        
        c.setFont("Helvetica", 10)
        c.drawString(margin_horizontal, 180, "Nombre: _________________________________________")
        c.drawString(margin_horizontal, 160, "Cédula: __________________________________________")
        c.drawString(margin_horizontal, 140, "Firma: ___________________________________________")
        
        # Sección de firmas - QUIEN RECIBE
        c.setFont("Helvetica-Bold", 12)
        c.drawString(width / 2 + 20, 200, "Quien Recibe:")
        
        c.setFont("Helvetica", 10)
        c.drawString(width / 2 + 20, 180, "Nombre: _________________________________________")
        c.drawString(width / 2 + 20, 160, "Cédula: __________________________________________")
        c.drawString(width / 2 + 20, 140, "Firma: ___________________________________________")
        
        # Resumen de items
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin_horizontal, 120, "Resumen de la carga:")
        c.setFont("Helvetica", 9)
        
        resumen_y = 105
        for grupo in grupos_items:
            resumen_text = f"• {grupo['producto_nombre']}: {grupo['cantidad']} unidad(es) - SKU: {grupo['producto_sku'] or 'N/A'}"
            # Truncar si es muy largo
            if len(resumen_text) > 80:
                resumen_text = resumen_text[:77] + "..."
            c.drawString(margin_horizontal, resumen_y, resumen_text)
            resumen_y -= 12
            if resumen_y < 50:  # Evitar que se salga de la página
                break
        
        # Pie de página
        c.setFont("Helvetica", 8)
        c.drawString(margin_horizontal, 30, "Documento generado electrónicamente")
        c.drawString(margin_horizontal, 20, f"Fecha de generación: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        c.save()
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        print(f"Error generando PDF de consolidado: {str(e)}")
        # Fallback: PDF simple sin tablas
        return generate_simple_consolidado_pdf(carga)

def obtener_items_agrupados_carga(carga):
    """Agrupa los items por producto"""
    items = carga.items.all().select_related('producto')
    
    # Diccionario para agrupar: clave = (producto_nombre, producto_sku)
    grupos_dict = defaultdict(lambda: {
        'producto_nombre': '',
        'producto_sku': '',
        'cantidad': 0,
        'items_ids': []
    })
    
    for item in items:
        producto = getattr(item, 'producto', None)
        producto_nombre = getattr(producto, 'nombre', 'Producto') if producto else 'Producto'
        producto_sku = getattr(producto, 'sku', '') if producto else ''
        
        # Clave única para agrupar
        clave = (producto_nombre, producto_sku)
        
        grupos_dict[clave]['producto_nombre'] = producto_nombre
        grupos_dict[clave]['producto_sku'] = producto_sku
        grupos_dict[clave]['cantidad'] += item.cantidad
        grupos_dict[clave]['items_ids'].append(item.id)
    
    # Convertir a lista ordenada por producto_nombre
    grupos_ordenados = sorted(
        grupos_dict.values(), 
        key=lambda x: x['producto_nombre']
    )
    
    return grupos_ordenados

def draw_consolidado_header(c, carga, width, height, margin_horizontal, logo_path, page_num):
    """Dibuja el encabezado del PDF"""
    # Logo
    if os.path.exists(logo_path):
        c.drawImage(logo_path, margin_horizontal, height - 80, width=80, height=60, preserveAspectRatio=True)
    
    # Título centrado
    c.setFont("Helvetica-Bold", 18)
    title = "TRANSPORTADORA TC"
    title_width = c.stringWidth(title, "Helvetica-Bold", 18)
    c.drawString((width - title_width) / 2, height - 50, title)
    
    c.setFont("Helvetica", 14)
    subtitle = "CONSOLIDADO DE MERCANCÍA"
    subtitle_width = c.stringWidth(subtitle, "Helvetica", 14)
    c.drawString((width - subtitle_width) / 2, height - 70, subtitle)
    
    # Información de la carga
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin_horizontal, height - 100, "Información de la Carga:")
    c.setFont("Helvetica", 10)
    
    info_y = height - 120
    c.drawString(margin_horizontal, info_y, f"Remesa ID: {carga.id}")
    c.drawString(margin_horizontal, info_y - 15, f"Remisión: {carga.remision}")
    c.drawString(margin_horizontal, info_y - 30, f"Factura: {carga.factura or 'N/A'}")
    
    # Columna derecha
    col2_x = width / 2
    c.drawString(col2_x, info_y, f"Cliente: {carga.cliente.nombre}")
    c.drawString(col2_x, info_y - 15, f"Proveedor: {carga.proveedor.nombre}")
    
    # Fecha de creación
    fecha_creacion = carga.created_at.strftime('%Y-%m-%d %H:%M:%S')
    c.drawString(col2_x, info_y - 30, f"Fecha Carga: {fecha_creacion}")
    
    # Observaciones (si existen)
    if carga.observaciones:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin_horizontal, info_y - 70, "Observaciones:")
        c.setFont("Helvetica", 9)
        # Dividir observaciones en líneas si es muy largo
        obs_lines = split_text(carga.observaciones, 100)
        for i, line in enumerate(obs_lines[:3]):  # Mostrar máximo 3 líneas
            c.drawString(margin_horizontal, info_y - 85 - (i * 12), line)
    
    # Número de página
    c.setFont("Helvetica", 8)
    c.drawRightString(width - margin_horizontal, height - 100, f"Página {page_num}")

def draw_consolidado_table(c, data, width, height, margin_horizontal, carga, logo_path, total_unidades):
    """Dibuja la tabla de productos centrada con margen superior adecuado"""
    if not data:
        # Mensaje si no hay items
        c.setFont("Helvetica", 12)
        c.drawString(margin_horizontal, height - 200, "No hay productos para mostrar")
        return
    
    # Configuración de la tabla con 3 columnas
    table_width = width - (2 * margin_horizontal)
    col_widths = [
        table_width * 0.50,  # Producto (más ancho)
        table_width * 0.20,  # Cantidad
        table_width * 0.30,  # SKU
    ]
    
    # Posición inicial de la tabla con margen superior
    table_start_y = height - 200
    cell_height = 25
    
    # Encabezados de la tabla
    headers = ["Producto", "Cantidad", "SKU"]
    
    # Calcular posición X para centrar la tabla
    table_x_start = (width - table_width) / 2
    
    x_positions = [
        table_x_start,
        table_x_start + col_widths[0],
        table_x_start + col_widths[0] + col_widths[1],
    ]
    
    current_y = table_start_y
    
    # Dibujar encabezado de la tabla
    c.setFont("Helvetica-Bold", 11)
    
    # Primero dibujar los rectángulos de fondo del encabezado
    for i in range(len(headers)):
        c.setFillColor(colors.HexColor("#4F81BD"))
        c.rect(x_positions[i], current_y, col_widths[i], cell_height, fill=1, stroke=1)
    
    # Luego dibujar el texto del encabezado por encima
    c.setFillColor(colors.white)
    for i, header in enumerate(headers):
        text_x = x_positions[i] + (col_widths[i] - c.stringWidth(header, "Helvetica-Bold", 11)) / 2
        text_y = current_y + (cell_height - 11) / 2
        c.drawString(text_x, text_y, header)
    
    current_y -= cell_height
    
    # Dibujar filas de datos
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    
    for row_index, row in enumerate(data):
        # Dibujar fondo alternado para las filas
        if row_index % 2 == 0:
            for i in range(len(headers)):
                c.setFillColor(colors.HexColor("#F8F9FA"))
                c.rect(x_positions[i], current_y, col_widths[i], cell_height, fill=1, stroke=1)
        else:
            for i in range(len(headers)):
                c.setFillColor(colors.white)
                c.rect(x_positions[i], current_y, col_widths[i], cell_height, fill=1, stroke=1)
        
        # Dibujar el texto de la fila por encima del fondo
        c.setFillColor(colors.black)
        for col_index, cell_text in enumerate(row):
            # Truncar texto si es muy largo (excepto cantidad)
            if col_index != 1:  # No truncar la columna de cantidad
                max_chars = int(col_widths[col_index] / 6)
                if len(str(cell_text)) > max_chars:
                    cell_text = str(cell_text)[:max_chars-3] + "..."
            
            # Alinear texto en la celda
            text_width = c.stringWidth(str(cell_text), "Helvetica", 10)
            
            if col_index == 0:  # Producto - alineado a la izquierda
                text_x = x_positions[col_index] + 5
            else:  # Cantidad y SKU - centrado
                text_x = x_positions[col_index] + (col_widths[col_index] - text_width) / 2
            
            text_y = current_y + (cell_height - 10) / 2
            c.drawString(text_x, text_y, str(cell_text))
        
        current_y -= cell_height
        
        # Verificar si necesitamos una nueva página
        if current_y < 300:  # Más espacio para el resumen y firmas
            c.showPage()
            draw_consolidado_header(c, carga, width, height, margin_horizontal, logo_path, 2)
            current_y = table_start_y
    
    # Fila del total como campo único sin divisiones
    current_y -= 10
    
    # Dibujar una línea de separación antes del total
    c.setLineWidth(1)
    c.setStrokeColor(colors.HexColor("#4F81BD"))
    c.line(x_positions[0], current_y + cell_height + 5, 
           x_positions[-1] + col_widths[-1], current_y + cell_height + 5)
    
    # Crear una sola celda unificada para todo el total
    total_table_width = sum(col_widths)  # Ancho total de toda la tabla
    
    # Dibujar el fondo único sin divisiones
    c.setFillColor(colors.HexColor("#4F81BD"))  # Fondo azul uniforme
    c.rect(x_positions[0], current_y, total_table_width, cell_height, fill=1, stroke=1)
    
    # Texto "TOTAL" a la izquierda
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    
    total_text = f"TOTAL UNIDADES: {total_unidades}"
    text_width = c.stringWidth(total_text, "Helvetica-Bold", 14)
    text_x = x_positions[0] + (total_table_width - text_width) / 2  # Centrado
    text_y = current_y + (cell_height - 14) / 2
    c.drawString(text_x, text_y, total_text)

def generate_simple_consolidado_pdf(carga):
    """Versión simple de respaldo sin tablas complejas"""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    width, height = letter
    margin = 50
    
    # Encabezado
    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, height - 50, "CONSOLIDADO DE MERCANCÍA")
    c.setFont("Helvetica", 12)
    c.drawString(margin, height - 70, f"Remesa ID: {carga.id}")
    c.drawString(margin, height - 90, f"Remisión: {carga.remision}")
    c.drawString(margin, height - 110, f"Cliente: {carga.cliente.nombre}")
    c.drawString(margin, height - 130, f"Proveedor: {carga.proveedor.nombre}")
    
    # Items agrupados
    grupos_items = obtener_items_agrupados_carga(carga)
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, height - 160, "Productos en la carga:")
    c.setFont("Helvetica", 10)
    
    y_position = height - 180
    total_unidades = 0
    
    for grupo in grupos_items:
        texto_item = f"• {grupo['producto_nombre']} - Cantidad: {grupo['cantidad']} - SKU: {grupo['producto_sku'] or 'N/A'}"
        c.drawString(margin, y_position, texto_item)
        y_position -= 15
        total_unidades += grupo['cantidad']
        
        if y_position < 150:
            c.showPage()
            y_position = height - 50
    
    # Total
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin, y_position - 20, f"TOTAL UNIDADES: {total_unidades}")
    
    # Firmas - Quien Entrega
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, 200, "Quien Entrega:")
    c.setFont("Helvetica", 10)
    c.drawString(margin, 180, "Nombre: _________________________________________")
    c.drawString(margin, 160, "Cédula: __________________________________________")
    c.drawString(margin, 140, "Firma: ___________________________________________")
    
    # Firmas - Quien Recibe
    c.setFont("Helvetica-Bold", 12)
    c.drawString(width / 2 + 20, 200, "Quien Recibe:")
    c.setFont("Helvetica", 10)
    c.drawString(width / 2 + 20, 180, "Nombre: _________________________________________")
    c.drawString(width / 2 + 20, 160, "Cédula: __________________________________________")
    c.drawString(width / 2 + 20, 140, "Firma: ___________________________________________")
    
    c.save()
    buffer.seek(0)
    return buffer

def split_text(text, max_length):
    """Divide un texto en líneas de máximo max_length caracteres"""
    if not text:
        return []
    
    words = text.split()
    lines = []
    current_line = ""
    
    for word in words:
        if len(current_line) + len(word) + 1 <= max_length:
            current_line += (" " if current_line else "") + word
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    
    if current_line:
        lines.append(current_line)
    
    return lines