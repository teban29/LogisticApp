# Standard library imports
import os
from io import BytesIO

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
        
        # Preparar datos de la tabla
        items = envio.items.all().select_related(
            'unidad__carga_item__carga__proveedor',
            'unidad__carga_item__producto'
        )
        
        data = []
        for item in items:
            # Usar getattr para evitar errores si las relaciones son None
            unidad = getattr(item, 'unidad', None)
            carga_item = getattr(unidad, 'carga_item', None) if unidad else None
            carga = getattr(carga_item, 'carga', None) if carga_item else None
            proveedor = getattr(carga, 'proveedor', None) if carga else None
            producto = getattr(carga_item, 'producto', None) if carga_item else None
            
            remision = getattr(carga, 'remision', 'N/A')
            proveedor_nombre = getattr(proveedor, 'nombre', 'N/A') if proveedor else 'N/A'
            producto_nombre = getattr(producto, 'nombre', 'Producto') if producto else 'Producto'
            
            data.append([producto_nombre, remision, proveedor_nombre])
        
        # Dibujar tabla con margen superior y centrada
        draw_table(c, data, width, height, margin_horizontal, envio, logo_path)
        
        # Sección de firmas
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin_horizontal, 200, "Confirmación de Recepción:")
        
        c.setFont("Helvetica", 10)
        c.drawString(margin_horizontal, 180, "Nombre: _________________________________________")
        c.drawString(margin_horizontal, 160, "Cédula: __________________________________________")
        c.drawString(margin_horizontal, 140, "Firma: ___________________________________________")
        
        # Pie de página
        c.setFont("Helvetica", 8)
        c.drawString(margin_horizontal, 100, "Documento generado electrónicamente")
        c.drawString(margin_horizontal, 90, f"Fecha de generación: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        c.save()
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        print(f"Error generando PDF: {str(e)}")
        # Fallback: PDF simple sin tablas
        return generate_simple_pdf(envio)

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
        return
    
    # Configuración de la tabla
    table_width = width - (2 * margin_horizontal)
    col_widths = [
        table_width * 0.40,  # Producto
        table_width * 0.30,  # Remisión  
        table_width * 0.30,  # Proveedor
    ]
    
    # Posición inicial de la tabla con margen superior
    table_start_y = height - 200  # Margen superior más amplio
    cell_height = 25
    
    # Encabezados de la tabla
    headers = ["Producto", "Remisión", "Proveedor"]
    
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
            # Truncar texto si es muy largo
            max_chars = int(col_widths[col_index] / 6)  # Aproximadamente 6 puntos por carácter
            if len(str(cell_text)) > max_chars:
                cell_text = str(cell_text)[:max_chars-3] + "..."
            
            # Centrar texto en la celda
            text_width = c.stringWidth(str(cell_text), "Helvetica", 10)
            text_x = x_positions[col_index] + (col_widths[col_index] - text_width) / 2
            text_y = current_y + (cell_height - 10) / 2
            c.drawString(text_x, text_y, str(cell_text))
        
        current_y -= cell_height
        
        # Verificar si necesitamos una nueva página
        if current_y < 250:  # Dejar espacio para firmas
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
    
    # Items
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, height - 140, "Productos entregados:")
    c.setFont("Helvetica", 10)
    
    y_position = height - 160
    items = envio.items.all()
    
    for item in items:
        producto_nombre = "Producto"
        if hasattr(item, 'unidad') and item.unidad and hasattr(item.unidad, 'carga_item'):
            producto_nombre = getattr(item.unidad.carga_item.producto, 'nombre', 'Producto')
        
        c.drawString(margin, y_position, f"• {producto_nombre}")
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
        
        # Preparar datos de la tabla con valores unitarios
        items = envio.items.all().select_related(
            'unidad__carga_item__carga__proveedor',
            'unidad__carga_item__producto'
        )
        
        data = []
        total_envio = 0
        
        for item in items:
            # Usar getattr para evitar errores si las relaciones son None
            unidad = getattr(item, 'unidad', None)
            carga_item = getattr(unidad, 'carga_item', None) if unidad else None
            carga = getattr(carga_item, 'carga', None) if carga_item else None
            proveedor = getattr(carga, 'proveedor', None) if carga else None
            producto = getattr(carga_item, 'producto', None) if carga_item else None
            
            remision = getattr(carga, 'remision', 'N/A')
            proveedor_nombre = getattr(proveedor, 'nombre', 'N/A') if proveedor else 'N/A'
            producto_nombre = getattr(producto, 'nombre', 'Producto') if producto else 'Producto'
            valor_unitario = getattr(item, 'valor_unitario', 0)
            
            # Formatear valor unitario como moneda
            valor_unitario_str = f"${valor_unitario:,.0f}"
            
            data.append([producto_nombre, remision, proveedor_nombre, valor_unitario_str])
            total_envio += valor_unitario
        
        # Dibujar tabla con margen superior y centrada
        draw_billing_table(c, data, width, height, margin_horizontal, envio, logo_path, total_envio)
        
        # Sección de firmas
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin_horizontal, 200, "Confirmación de Recepción:")
        
        c.setFont("Helvetica", 10)
        c.drawString(margin_horizontal, 180, "Nombre: _________________________________________")
        c.drawString(margin_horizontal, 160, "Cédula: __________________________________________")
        c.drawString(margin_horizontal, 140, "Firma: ___________________________________________")
        
        # Pie de página
        c.setFont("Helvetica", 8)
        c.drawString(margin_horizontal, 100, "Documento generado electrónicamente")
        c.drawString(margin_horizontal, 90, f"Fecha de generación: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        c.save()
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        print(f"Error generando PDF de cuenta de cobro: {str(e)}")
        # Fallback: PDF simple sin tablas
        return generate_simple_billing_pdf(envio)

def draw_billing_header(c, envio, width, height, margin_horizontal, logo_path, page_num):
    """Dibuja el encabezado del PDF para cuenta de cobro"""
    # Logo
    if os.path.exists(logo_path):
        c.drawImage(logo_path, margin_horizontal, height - 80, width=80, height=60, preserveAspectRatio=True)
    
    # Título centrado
    c.setFont("Helvetica-Bold", 18)
    title = "TRANSPORTADORA TC"
    title_width = c.stringWidth(title, "Helvetica-Bold", 18)
    c.drawString((width - title_width) / 2, height - 50, title)
    
    c.setFont("Helvetica", 12)
    subtitle = "Cuenta de Cobro"
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

def draw_billing_table(c, data, width, height, margin_horizontal, envio, logo_path, total_envio):
    """Dibuja la tabla de productos con valores unitarios y total"""
    if not data:
        return
    
    # Configuración de la tabla
    table_width = width - (2 * margin_horizontal)
    col_widths = [
        table_width * 0.35,  # Producto
        table_width * 0.25,  # Remisión  
        table_width * 0.25,  # Proveedor
        table_width * 0.15,  # Valor Unitario
    ]
    
    # Posición inicial de la tabla con margen superior
    table_start_y = height - 200  # Margen superior más amplio
    cell_height = 25
    
    # Encabezados de la tabla
    headers = ["Producto", "Remisión", "Proveedor", "Valor Unitario"]
    
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
            # Truncar texto si es muy largo (excepto para valores monetarios)
            if col_index < 3:  # No truncar la columna de valor unitario
                max_chars = int(col_widths[col_index] / 6)  # Aproximadamente 6 puntos por carácter
                if len(str(cell_text)) > max_chars:
                    cell_text = str(cell_text)[:max_chars-3] + "..."
            
            # Alinear a la derecha para valores monetarios, centrar para el resto
            if col_index == 3:  # Columna de valor unitario
                text_width = c.stringWidth(str(cell_text), "Helvetica", 10)
                text_x = x_positions[col_index] + col_widths[col_index] - text_width - 5
            else:
                text_width = c.stringWidth(str(cell_text), "Helvetica", 10)
                text_x = x_positions[col_index] + (col_widths[col_index] - text_width) / 2
            
            text_y = current_y + (cell_height - 10) / 2
            c.drawString(text_x, text_y, str(cell_text))
        
        current_y -= cell_height
        
        # Verificar si necesitamos una nueva página
        if current_y < 300:  # Dejar más espacio para total y firmas
            c.showPage()
            draw_billing_header(c, envio, width, height, margin_horizontal, logo_path, 2)
            current_y = table_start_y
    
    # Dibujar fila del total
    current_y -= 10  # Espacio adicional antes del total
    
    # Fondo para la fila del total
    for i in range(len(headers)):
        c.setFillColor(colors.HexColor("#4F81BD"))
        c.rect(x_positions[i], current_y, col_widths[i], cell_height, fill=1, stroke=1)
    
    # Texto del total
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 12)
    
    # "TOTAL" en las primeras columnas
    total_text = "TOTAL"
    text_x = x_positions[0] + (col_widths[0] + col_widths[1] + col_widths[2] - c.stringWidth(total_text, "Helvetica-Bold", 12)) / 2
    text_y = current_y + (cell_height - 12) / 2
    c.drawString(text_x, text_y, total_text)
    
    # Valor total alineado a la derecha
    total_str = f"${total_envio:,.0f}"
    text_width = c.stringWidth(total_str, "Helvetica-Bold", 12)
    text_x = x_positions[3] + col_widths[3] - text_width - 5
    c.drawString(text_x, text_y, total_str)

def generate_simple_billing_pdf(envio):
    """Versión simple de respaldo para cuenta de cobro sin tablas complejas"""
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    
    width, height = letter
    margin = 50
    
    # Encabezado
    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, height - 50, "CUENTA DE COBRO")
    c.setFont("Helvetica", 12)
    c.drawString(margin, height - 70, f"Guía: {envio.numero_guia}")
    c.drawString(margin, height - 90, f"Cliente: {envio.cliente.nombre}")
    c.drawString(margin, height - 110, f"Origen: {envio.origen}")
    
    # Items
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, height - 140, "Productos y valores:")
    c.setFont("Helvetica", 10)
    
    y_position = height - 160
    items = envio.items.all()
    total_envio = 0
    
    for item in items:
        producto_nombre = "Producto"
        if hasattr(item, 'unidad') and item.unidad and hasattr(item.unidad, 'carga_item'):
            producto_nombre = getattr(item.unidad.carga_item.producto, 'nombre', 'Producto')
        
        valor_unitario = getattr(item, 'valor_unitario', 0)
        total_envio += valor_unitario
        
        c.drawString(margin, y_position, f"• {producto_nombre} - ${valor_unitario:,.0f}")
        y_position -= 15
        
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
