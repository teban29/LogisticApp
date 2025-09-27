# Standard library imports
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

def generate_acta_entrega_pdf(envio):
    try:
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        width, height = letter
        margin_horizontal = 50
        
        # Logo de la empresa
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'logo_empresa.png')
        
        # Dibujar primera página
        draw_header(c, envio, width, height, margin_horizontal, logo_path, 1)
        
        # Obtener items agrupados (NUEVA FUNCIÓN)
        grupos_items = obtener_items_agrupados(envio)
        
        # Preparar datos de la tabla AGRUPADOS con columnas separadas
        data = []
        for grupo in grupos_items:
            # Formato: "Producto" - "Cantidad" - "Remisión" - "Proveedor"
            data.append([
                grupo['producto_nombre'], 
                str(grupo['cantidad']), 
                grupo['remision'], 
                grupo['proveedor_nombre']
            ])
        
        # Dibujar tabla con margen superior y centrada
        draw_table(c, data, width, height, margin_horizontal, envio, logo_path)
        
        # Sección de firmas
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin_horizontal, 200, "Confirmación de Recepción:")
        
        c.setFont("Helvetica", 10)
        c.drawString(margin_horizontal, 180, "Nombre: _________________________________________")
        c.drawString(margin_horizontal, 160, "Cédula: __________________________________________")
        c.drawString(margin_horizontal, 140, "Firma: ___________________________________________")
        
        # Resumen de items (NUEVA SECCIÓN)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin_horizontal, 120, "Resumen de la entrega:")
        c.setFont("Helvetica", 9)
        
        resumen_y = 105
        for grupo in grupos_items:
            resumen_text = f"• {grupo['producto_nombre']}: {grupo['cantidad']} unidad(es) - Rem: {grupo['remision']}"
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
        print(f"Error generando PDF: {str(e)}")
        # Fallback: PDF simple sin tablas
        return generate_simple_pdf(envio)

def obtener_items_agrupados(envio):
    """Agrupa los items por producto, remisión y proveedor (igual que en el frontend)"""
    items = envio.items.all().select_related(
        'unidad__carga_item__carga__proveedor',
        'unidad__carga_item__producto'
    )
    
    # Diccionario para agrupar: clave = (producto_nombre, remision, proveedor_nombre)
    grupos_dict = defaultdict(lambda: {
        'producto_nombre': '',
        'remision': '',
        'proveedor_nombre': '',
        'cantidad': 0,
        'items_ids': []
    })
    
    for item in items:
        # Usar getattr para evitar errores si las relaciones son None
        unidad = getattr(item, 'unidad', None)
        carga_item = getattr(unidad, 'carga_item', None) if unidad else None
        carga = getattr(carga_item, 'carga', None) if carga_item else None
        proveedor = getattr(carga, 'proveedor', None) if carga else None
        producto = getattr(carga_item, 'producto', None) if carga_item else None
        
        producto_nombre = getattr(producto, 'nombre', 'Producto') if producto else 'Producto'
        remision = getattr(carga, 'remision', 'N/A')
        proveedor_nombre = getattr(proveedor, 'nombre', 'N/A') if proveedor else 'N/A'
        
        # Clave única para agrupar
        clave = (producto_nombre, remision, proveedor_nombre)
        
        grupos_dict[clave]['producto_nombre'] = producto_nombre
        grupos_dict[clave]['remision'] = remision
        grupos_dict[clave]['proveedor_nombre'] = proveedor_nombre
        grupos_dict[clave]['cantidad'] += 1
        grupos_dict[clave]['items_ids'].append(item.id)
    
    # Convertir a lista ordenada por producto_nombre
    grupos_ordenados = sorted(
        grupos_dict.values(), 
        key=lambda x: x['producto_nombre']
    )
    
    return grupos_ordenados

def draw_header(c, envio, width, height, margin_horizontal, logo_path, page_num):
    """Dibuja el encabezado del PDF"""
    # Logo
    if os.path.exists(logo_path):
        c.drawImage(logo_path, margin_horizontal, height - 80, width=80, height=60, preserveAspectRatio=True)
    
    # Título centrado
    c.setFont("Helvetica-Bold", 18)
    title = "TRANSPORTADORA TC"
    title_width = c.stringWidth(title, "Helvetica-Bold", 18)
    c.drawString((width - title_width) / 2, height - 50, title)
    
    c.setFont("Helvetica", 12)
    subtitle = "Comprobante de entrega de mercancía"
    subtitle_width = c.stringWidth(subtitle, "Helvetica", 12)
    c.drawString((width - subtitle_width) / 2, height - 70, subtitle)
    
    # Información del envío
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin_horizontal, height - 100, "Información del Envío:")
    c.setFont("Helvetica", 10)
    
    info_y = height - 120
    c.drawString(margin_horizontal, info_y, f"Número de Guía: {envio.numero_guia}")
    c.drawString(margin_horizontal, info_y - 15, f"Cliente: {envio.cliente.nombre}")
    c.drawString(margin_horizontal, info_y - 30, f"Origen: {envio.origen}")
    
    # Número de página
    c.setFont("Helvetica", 8)
    c.drawRightString(width - margin_horizontal, height - 100, f"Página {page_num}")

def draw_table(c, data, width, height, margin_horizontal, envio, logo_path):
    """Dibuja la tabla de productos centrada con margen superior adecuado"""
    if not data:
        # Mensaje si no hay items
        c.setFont("Helvetica", 12)
        c.drawString(margin_horizontal, height - 200, "No hay productos para mostrar")
        return
    
    # Configuración de la tabla con 4 columnas
    table_width = width - (2 * margin_horizontal)
    col_widths = [
        table_width * 0.40,  # Producto (más ancho)
        table_width * 0.15,  # Cantidad (nueva columna)
        table_width * 0.20,  # Remisión  
        table_width * 0.25,  # Proveedor
    ]
    
    # Posición inicial de la tabla con margen superior
    table_start_y = height - 200
    cell_height = 25
    
    # Encabezados de la tabla
    headers = ["Producto", "Cantidad", "Remisión", "Proveedor"]
    
    # Calcular posición X para centrar la tabla
    table_x_start = (width - table_width) / 2
    
    x_positions = [
        table_x_start,
        table_x_start + col_widths[0],
        table_x_start + col_widths[0] + col_widths[1],
        table_x_start + col_widths[0] + col_widths[1] + col_widths[2],
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
            
            # Centrar texto en la celda
            text_width = c.stringWidth(str(cell_text), "Helvetica", 10)
            text_x = x_positions[col_index] + (col_widths[col_index] - text_width) / 2
            text_y = current_y + (cell_height - 10) / 2
            c.drawString(text_x, text_y, str(cell_text))
        
        current_y -= cell_height
        
        # Verificar si necesitamos una nueva página
        if current_y < 300:  # Más espacio para el resumen y firmas
            c.showPage()
            draw_header(c, envio, width, height, margin_horizontal, logo_path, 2)
            current_y = table_start_y

def generate_simple_pdf(envio):
    """Versión simple de respaldo sin tablas complejas"""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    width, height = letter
    margin = 50
    
    # Encabezado
    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, height - 50, "ACTA DE ENTREGA")
    c.setFont("Helvetica", 12)
    c.drawString(margin, height - 70, f"Guía: {envio.numero_guia}")
    c.drawString(margin, height - 90, f"Cliente: {envio.cliente.nombre}")
    c.drawString(margin, height - 110, f"Origen: {envio.origen}")
    
    # Items agrupados (también en la versión simple)
    grupos_items = obtener_items_agrupados(envio)
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, height - 140, "Productos entregados:")
    c.setFont("Helvetica", 10)
    
    y_position = height - 160
    for grupo in grupos_items:
        texto_item = f"• {grupo['producto_nombre']} - Cantidad: {grupo['cantidad']} - Rem: {grupo['remision']}"
        c.drawString(margin, y_position, texto_item)
        y_position -= 15
        
        if y_position < 100:
            c.showPage()
            y_position = height - 50
    
    # Firmas
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, 200, "Confirmación de Recepción:")
    c.setFont("Helvetica", 10)
    c.drawString(margin, 180, "Nombre: _________________________________________")
    c.drawString(margin, 160, "Cédula: __________________________________________")
    c.drawString(margin, 140, "Firma: ___________________________________________")
    
    c.save()
    buffer.seek(0)
    return buffer

def generate_cuenta_cobro_pdf(envio):
    try:
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        width, height = letter
        margin_horizontal = 50
        
        # Logo de la empresa
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'img', 'logo_empresa.png')
        
        # Dibujar primera página
        draw_billing_header(c, envio, width, height, margin_horizontal, logo_path, 1)
        
        # Obtener items agrupados con valores
        grupos_items = obtener_items_agrupados_con_valores(envio)
        
        # Preparar datos de la tabla AGRUPADOS con columnas separadas
        data = []
        total_envio = 0
        
        for grupo in grupos_items:
            # Formato: "Producto" - "Cantidad" - "Remisión" - "Proveedor" - "Valor Total"
            valor_total = grupo['valor_total']
            valor_total_str = f"${valor_total:,.0f}"
            
            data.append([
                grupo['producto_nombre'], 
                str(grupo['cantidad']), 
                grupo['remision'], 
                grupo['proveedor_nombre'], 
                valor_total_str
            ])
            total_envio += valor_total
        
        # Dibujar tabla con valores agrupados
        draw_billing_table(c, data, width, height, margin_horizontal, envio, logo_path, total_envio)
        
        # Sección de firmas
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin_horizontal, 200, "Confirmación de Recepción:")
        
        c.setFont("Helvetica", 10)
        c.drawString(margin_horizontal, 180, "Nombre: _________________________________________")
        c.drawString(margin_horizontal, 160, "Cédula: __________________________________________")
        c.drawString(margin_horizontal, 140, "Firma: ___________________________________________")
        
        # Resumen de items (NUEVA SECCIÓN)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin_horizontal, 120, "Resumen de valores:")
        c.setFont("Helvetica", 9)
        
        resumen_y = 105
        for grupo in grupos_items:
            resumen_text = f"• {grupo['producto_nombre']}: {grupo['cantidad']} × ${grupo['valor_unitario']:,.0f} = ${grupo['valor_total']:,.0f}"
            # Truncar si es muy largo
            if len(resumen_text) > 80:
                resumen_text = resumen_text[:77] + "..."
            c.drawString(margin_horizontal, resumen_y, resumen_text)
            resumen_y -= 12
            if resumen_y < 50:
                break
        
        # Pie de página
        c.setFont("Helvetica", 8)
        c.drawString(margin_horizontal, 30, "Documento generado electrónicamente")
        c.drawString(margin_horizontal, 20, f"Fecha de generación: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        c.save()
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        print(f"Error generando PDF de cuenta de cobro: {str(e)}")
        return generate_simple_billing_pdf(envio)

def obtener_items_agrupados_con_valores(envio):
    """Agrupa los items por producto, remisión y proveedor incluyendo valores"""
    items = envio.items.all().select_related(
        'unidad__carga_item__carga__proveedor',
        'unidad__carga_item__producto'
    )
    
    # Diccionario para agrupar
    grupos_dict = defaultdict(lambda: {
        'producto_nombre': '',
        'remision': '',
        'proveedor_nombre': '',
        'cantidad': 0,
        'valor_unitario': 0,
        'valor_total': 0,
        'items_ids': []
    })
    
    for item in items:
        unidad = getattr(item, 'unidad', None)
        carga_item = getattr(unidad, 'carga_item', None) if unidad else None
        carga = getattr(carga_item, 'carga', None) if carga_item else None
        proveedor = getattr(carga, 'proveedor', None) if carga else None
        producto = getattr(carga_item, 'producto', None) if carga_item else None
        
        producto_nombre = getattr(producto, 'nombre', 'Producto') if producto else 'Producto'
        remision = getattr(carga, 'remision', 'N/A')
        proveedor_nombre = getattr(proveedor, 'nombre', 'N/A') if proveedor else 'N/A'
        valor_unitario = getattr(item, 'valor_unitario', 0)
        
        # Clave única para agrupar
        clave = (producto_nombre, remision, proveedor_nombre)
        
        grupos_dict[clave]['producto_nombre'] = producto_nombre
        grupos_dict[clave]['remision'] = remision
        grupos_dict[clave]['proveedor_nombre'] = proveedor_nombre
        grupos_dict[clave]['cantidad'] += 1
        grupos_dict[clave]['valor_unitario'] = valor_unitario  # Usamos el último valor unitario
        grupos_dict[clave]['valor_total'] += valor_unitario
        grupos_dict[clave]['items_ids'].append(item.id)
    
    # Convertir a lista ordenada
    grupos_ordenados = sorted(
        grupos_dict.values(), 
        key=lambda x: x['producto_nombre']
    )
    
    return grupos_ordenados

def draw_billing_header(c, envio, width, height, margin_horizontal, logo_path, page_num):
    """Dibuja el encabezado del PDF para cuenta de cobro"""
    if os.path.exists(logo_path):
        c.drawImage(logo_path, margin_horizontal, height - 80, width=80, height=60, preserveAspectRatio=True)
    
    c.setFont("Helvetica-Bold", 18)
    title = "TRANSPORTADORA TC"
    title_width = c.stringWidth(title, "Helvetica-Bold", 18)
    c.drawString((width - title_width) / 2, height - 50, title)
    
    c.setFont("Helvetica", 12)
    subtitle = "Cuenta de Cobro"
    subtitle_width = c.stringWidth(subtitle, "Helvetica", 12)
    c.drawString((width - subtitle_width) / 2, height - 70, subtitle)
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin_horizontal, height - 100, "Información del Envío:")
    c.setFont("Helvetica", 10)
    
    info_y = height - 120
    c.drawString(margin_horizontal, info_y, f"Número de Guía: {envio.numero_guia}")
    c.drawString(margin_horizontal, info_y - 15, f"Cliente: {envio.cliente.nombre}")
    c.drawString(margin_horizontal, info_y - 30, f"Origen: {envio.origen}")
    
    c.setFont("Helvetica", 8)
    c.drawRightString(width - margin_horizontal, height - 100, f"Página {page_num}")

def draw_billing_table(c, data, width, height, margin_horizontal, envio, logo_path, total_envio):
    """Dibuja la tabla de productos con valores agrupados"""
    if not data:
        c.setFont("Helvetica", 12)
        c.drawString(margin_horizontal, height - 200, "No hay productos para mostrar")
        return
    
    table_width = width - (2 * margin_horizontal)
    col_widths = [
        table_width * 0.30,  # Producto
        table_width * 0.12,  # Cantidad
        table_width * 0.18,  # Remisión  
        table_width * 0.22,  # Proveedor
        table_width * 0.18,  # Valor Total
    ]
    
    table_start_y = height - 200
    cell_height = 25
    
    headers = ["Producto", "Cantidad", "Remisión", "Proveedor", "Valor Total"]
    
    table_x_start = (width - table_width) / 2
    
    x_positions = [
        table_x_start,
        table_x_start + col_widths[0],
        table_x_start + col_widths[0] + col_widths[1],
        table_x_start + col_widths[0] + col_widths[1] + col_widths[2],
        table_x_start + col_widths[0] + col_widths[1] + col_widths[2] + col_widths[3],
    ]
    
    current_y = table_start_y
    
    # Encabezado de la tabla
    c.setFont("Helvetica-Bold", 11)
    for i in range(len(headers)):
        c.setFillColor(colors.HexColor("#4F81BD"))
        c.rect(x_positions[i], current_y, col_widths[i], cell_height, fill=1, stroke=1)
    
    c.setFillColor(colors.white)
    for i, header in enumerate(headers):
        text_x = x_positions[i] + (col_widths[i] - c.stringWidth(header, "Helvetica-Bold", 11)) / 2
        text_y = current_y + (cell_height - 11) / 2
        c.drawString(text_x, text_y, header)
    
    current_y -= cell_height
    
    # Filas de datos
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    
    for row_index, row in enumerate(data):
        if row_index % 2 == 0:
            for i in range(len(headers)):
                c.setFillColor(colors.HexColor("#F8F9FA"))
                c.rect(x_positions[i], current_y, col_widths[i], cell_height, fill=1, stroke=1)
        else:
            for i in range(len(headers)):
                c.setFillColor(colors.white)
                c.rect(x_positions[i], current_y, col_widths[i], cell_height, fill=1, stroke=1)
        
        c.setFillColor(colors.black)
        for col_index, cell_text in enumerate(row):
            # No truncar cantidad y valor
            if col_index not in [1, 4]:  # No truncar cantidad ni valor
                max_chars = int(col_widths[col_index] / 6)
                if len(str(cell_text)) > max_chars:
                    cell_text = str(cell_text)[:max_chars-3] + "..."
            
            if col_index == 4:  # Columna de valor (alinear derecha)
                text_width = c.stringWidth(str(cell_text), "Helvetica", 10)
                text_x = x_positions[col_index] + col_widths[col_index] - text_width - 5
            else:
                text_width = c.stringWidth(str(cell_text), "Helvetica", 10)
                text_x = x_positions[col_index] + (col_widths[col_index] - text_width) / 2
            
            text_y = current_y + (cell_height - 10) / 2
            c.drawString(text_x, text_y, str(cell_text))
        
        current_y -= cell_height
        
        if current_y < 300:
            c.showPage()
            draw_billing_header(c, envio, width, height, margin_horizontal, logo_path, 2)
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
    
    total_text = "TOTAL"
    text_x_left = x_positions[0] + 20  # Margen desde la izquierda
    text_y = current_y + (cell_height - 14) / 2
    c.drawString(text_x_left, text_y, total_text)
    
    # Valor del total a la derecha
    total_str = f"${total_envio:,.0f}"
    text_width = c.stringWidth(total_str, "Helvetica-Bold", 14)
    text_x_right = x_positions[0] + total_table_width - text_width - 20  # Margen desde la derecha
    c.drawString(text_x_right, text_y, total_str)

def generate_simple_billing_pdf(envio):
    """Versión simple de respaldo para cuenta de cobro"""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    width, height = letter
    margin = 50
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, height - 50, "CUENTA DE COBRO")
    c.setFont("Helvetica", 12)
    c.drawString(margin, height - 70, f"Guía: {envio.numero_guia}")
    c.drawString(margin, height - 90, f"Cliente: {envio.cliente.nombre}")
    c.drawString(margin, height - 110, f"Origen: {envio.origen}")
    
    # Items agrupados
    grupos_items = obtener_items_agrupados_con_valores(envio)
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, height - 140, "Productos y valores:")
    c.setFont("Helvetica", 10)
    
    y_position = height - 160
    total_envio = 0
    
    for grupo in grupos_items:
        texto_item = f"• {grupo['producto_nombre']} - Cantidad: {grupo['cantidad']} - ${grupo['valor_total']:,.0f}"
        c.drawString(margin, y_position, texto_item)
        y_position -= 15
        total_envio += grupo['valor_total']
        
        if y_position < 150:
            c.showPage()
            y_position = height - 50
    
    # Total
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin, y_position - 20, f"TOTAL: ${total_envio:,.0f}")
    
    # Firmas
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, 200, "Confirmación de Recepción:")
    c.setFont("Helvetica", 10)
    c.drawString(margin, 180, "Nombre: _________________________________________")
    c.drawString(margin, 160, "Cédula: __________________________________________")
    c.drawString(margin, 140, "Firma: ___________________________________________")
    
    c.save()
    buffer.seek(0)
    return buffer