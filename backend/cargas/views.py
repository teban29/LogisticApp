from fileinput import filename
from rest_framework import viewsets, decorators, response, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Prefetch, Count
from django.http import HttpResponse
from .models import Carga, Unidad, CargaItem, Producto
from .serializers import CargaSerializer, UnidadSerializer, ProductoSerializer
from .permissions import IsAdminOrOperador, IsAdminOrOperadorForCargas, PuedeImprimirEtiquetas, IsAdminRole
from .services import generar_unidades_para_carga

from .filters import CargaFilter
from accounts.permissions import EsClienteYTieneCliente, SoloSuCliente

from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import mm, landscape
from reportlab.graphics.barcode import code128
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.enums import TA_CENTER

from rest_framework.response import Response
from rest_framework import status, decorators

from django.db.models import Q
from django.utils import timezone
from datetime import timedelta, datetime

from .pdf_utils import generate_consolidado_pdf
from django.http import HttpResponse


class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar productos del sistema.
    Solo accesible por usuarios con rol de administrador.
    """
    queryset = Producto.objects.all().order_by('id')
    serializer_class = ProductoSerializer
    permission_classes = [IsAdminRole]
    parser_classes = [JSONParser, MultiPartParser, FormParser]


class CargaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar cargas del sistema.
    Incluye funcionalidades para generar unidades y etiquetas.
    Accesible por administradores y usuarios cliente (solo sus cargas).
    """
    queryset = (
        Carga.objects
        .select_related('cliente', 'proveedor')
        .prefetch_related(Prefetch(
            'items',
            queryset=CargaItem.objects.select_related('producto').annotate(
                unidades_count=Count('unidades')
            )
        ))
        .order_by('-created_at')
    )
    serializer_class = CargaSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get_permissions(self):
        """
        Permisos diferenciados por acción:
        - List/Retrieve/Etiquetas: Admin, operador o cliente con cliente asignado
        - Create: Admin u operador  
        - Update/Delete: Solo admin
        """
        if self.action in ['list', 'retrieve', 'etiquetas']:
            # Clientes solo pueden ver, admin y operador pueden ver e imprimir etiquetas
            permission_classes = [EsClienteYTieneCliente | IsAdminOrOperadorForCargas]
        elif self.action == 'create':
            # Solo admin y operador pueden crear
            permission_classes = [IsAdminOrOperadorForCargas]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Solo admin puede modificar/eliminar
            permission_classes = [IsAdminRole]
        else:
            # Para otras acciones, solo admin
            permission_classes = [IsAdminRole]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filtra cargas por usuario, búsqueda, cliente, proveedor, y fechas"""
        queryset = super().get_queryset()
        
        # FILTRO AUTOMÁTICO POR CLIENTE PARA USUARIOS CLIENTE
        if self.request.user.rol == 'cliente' and self.request.user.cliente:
            queryset = queryset.filter(cliente=self.request.user.cliente)
        
        # Obtener parámetros de filtro
        search = self.request.query_params.get('search')
        cliente_id = self.request.query_params.get('cliente_id')
        proveedor_id = self.request.query_params.get('proveedor_id')
        estado = self.request.query_params.get('estado')
        fecha_rango = self.request.query_params.get('fecha_rango')
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')
        
        # RESTRICCIÓN: Usuarios cliente no pueden filtrar por otros clientes
        if self.request.user.rol == 'cliente' and cliente_id:
            # Ignorar filtro de cliente_id si el usuario es cliente
            # para evitar que filtren por otros clientes
            pass
        elif cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
        
        if proveedor_id:
            queryset = queryset.filter(proveedor_id=proveedor_id)
        
        if estado:
            queryset = queryset.filter(estado=estado)
        
        # Filtro de búsqueda
        if search:
            queryset = queryset.filter(
                Q(remision__icontains=search) |
                Q(cliente__nombre__icontains=search) |
                Q(proveedor__nombre__icontains=search) |
                Q(items__producto__nombre__icontains=search) |
                Q(items__producto__sku__icontains=search)
            ).distinct()
        
        # Filtros de fecha
        now = timezone.now()
        if fecha_rango:
            if fecha_rango == 'hoy':
                today = now.date()
                queryset = queryset.filter(created_at__date=today)
            elif fecha_rango == 'ultima_semana':
                week_ago = now - timedelta(days=7)
                queryset = queryset.filter(created_at__gte=week_ago)
            elif fecha_rango == 'ultimo_mes':
                month_ago = now - timedelta(days=30)
                queryset = queryset.filter(created_at__gte=month_ago)
            elif fecha_rango == 'ultimo_ano':
                year_ago = now - timedelta(days=365)
                queryset = queryset.filter(created_at__gte=year_ago)
        
        # Filtro de fecha personalizado
        if fecha_inicio and fecha_fin:
            try:
                start_date = datetime.strptime(fecha_inicio, '%Y-%m-%d')
                end_date = datetime.strptime(fecha_fin, '%Y-%m-%d')
                # Ajustar end_date para incluir todo el día
                end_date = end_date.replace(hour=23, minute=59, second=59)
                queryset = queryset.filter(
                    created_at__range=(start_date, end_date)
                )
            except ValueError:
                # Si las fechas no son válidas, ignorar el filtro
                pass
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Sobrescribir list para agregar metadata sobre filtros aplicados"""
        response = super().list(request, *args, **kwargs)
        
        # Agregar información sobre el filtro automático aplicado
        if request.user.rol == 'cliente' and request.user.cliente:
            response.data['filtro_automatico'] = {
                'cliente': {
                    'id': request.user.cliente.id,
                    'nombre': request.user.cliente.nombre
                },
                'mensaje': 'Mostrando solo las cargas de su cliente asignado'
            }
        
        return response
    
    @decorators.action(detail=True, methods=['get'], permission_classes=[IsAdminOrOperador])
    def consolidado_pdf(self, request, pk=None):
        """
        Genera y descarga el PDF de Consolidado de Mercancía
        GET /api/cargas/{id}/consolidado_pdf/
        """
        carga = self.get_object()
        
        try:
            # Generar el PDF
            pdf_buffer = generate_consolidado_pdf(carga)
            
            # Crear la respuesta HTTP
            response = HttpResponse(pdf_buffer, content_type='application/pdf')
            
            # Configurar el nombre del archivo
            # Reemplazar caracteres problemáticos en la remisión
            safe_remision = carga.remision.replace('/', '_').replace('\\', '_')
            filename = f"consolidado_carga_{carga.id}_{safe_remision}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            print(f"Error generando consolidado PDF: {str(e)}")
            return Response(
                {'error': 'Error al generar el PDF del consolidado'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @decorators.action(detail=True, methods=['post'], permission_classes=[IsAdminRole])
    def generar_unidades(self, request, pk=None):
        """
        Genera unidades para una carga específica.
        Solo disponible para administradores.
        """
        carga = self.get_object()
        generar_unidades_para_carga(carga)
        return response.Response(
            {'detail': 'Unidades generadas'}, 
            status=status.HTTP_200_OK
        )
    
    @decorators.action(detail=True, methods=['get'], url_path='etiquetas', permission_classes=[IsAdminOrOperador])
    def etiquetas(self, request, pk=None):
        """
        GET /api/cargas/<id>/etiquetas/?item_id=XX
        1 unidad = 1 página (100x80mm, landscape)
        - Barcode EXACTO: 85mm ancho x 44mm alto, centrado
        - Tipografía: Helvetica, 12pt (líneas), 11pt (ID)
        """
        
        print(f"Usuario: {request.user}")
        print(f"Rol: {request.user.rol}")
        print(f"Autenticado: {request.user.is_authenticated}")
        print(f"Método: {request.method}")
        
        carga = self.get_object()    
        
        item_id = request.query_params.get('item_id')

        qs = Unidad.objects.select_related(
            'carga_item__producto', 'carga_item__carga',
            'carga_item__carga__cliente', 'carga_item__carga__proveedor'
        ).filter(carga_item__carga=carga)
        if item_id:
            qs = qs.filter(carga_item_id=item_id)
        unidades = list(qs.order_by('id'))
        if not unidades:
            return response.Response(
                {'detail': 'No hay unidades para generar etiquetas. ¿Ya generaste las unidades?'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Tamaño etiqueta
        label_w, label_h = 100*mm, 80*mm
        page_size = landscape((label_w, label_h))
        margin = 5*mm
        inner_w = label_w - 2*margin

        # Texto: centrado, tamaños ajustados
        styles = getSampleStyleSheet()
        base = ParagraphStyle(
            'LabelBase',
            parent=styles['Normal'],
            alignment=TA_CENTER,
            fontName='Helvetica',      # Core PDF font
            fontSize=12,               # texto general
            leading=13
        )
        # Para el ID ligeramente menor
        small = ParagraphStyle(
            'LabelSmall',
            parent=base,
            fontSize=11,
            leading=12
        )

        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=page_size)

        # Medidas del barcode optimizadas para escaneo
        # Aumentamos el width para que las barras no sean tan delgadas (menor densidad)
        target_bw = 80*mm
        target_bh = 22*mm

        for u in unidades:
            producto = u.carga_item.producto
            cliente = u.carga_item.carga.cliente

            codigo = u.codigo_barra
            # Agregamos humanReadable para que aparezca el ID debajo del código
            bcode = code128.Code128(codigo, barHeight=target_bh, humanReadable=True)
            nat_w, nat_h = bcode.wrap(0, 0)

            # Calculamos escala para ocupar el ancho objetivo sin exceder los límites
            # Usamos un ancho máximo de 80mm para dar buena "Quiet Zone" a los lados
            sx = float(target_bw) / float(nat_w) if nat_w else 1.0
            # No escalamos en Y para mantener la proporción de las barras nítida
            sy = 1.0 

            bx = (label_w - (nat_w * sx)) / 2.0
            by = label_h - margin - target_bh - (5*mm)

            c.saveState()
            c.translate(bx, by)
            c.scale(sx, sy)
            bcode.drawOn(c, 0, 0)
            c.restoreState()

            info_lines = [
                Paragraph(f"<b>CLIENTE:</b> {cliente.nombre[:24]}", base),
                Paragraph(f"<b>PRODUCTO:</b> {producto.nombre[:24]}", base),
                Paragraph(f"<b>REM:</b> {u.carga_item.carga.remision}", base),
            ]

            y = 8*mm
            for p in info_lines:
                p.wrapOn(c, inner_w, 12*mm)
                p.drawOn(c, margin, y)
                y += p.height + (1.0*mm)

            c.showPage() 

        c.save()
        buf.seek(0)

        filename = (
            f"etiquetas_carga_{carga.id}_item_{item_id}.pdf" if item_id
            else f"etiquetas_carga_{carga.id}.pdf"
        )
        resp = HttpResponse(buf.getvalue(), content_type='application/pdf')
        resp['Content-Disposition'] = f'inline; filename="{filename}"'
        return resp


class UnidadViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Unidad.objects.select_related('carga_item__carga__cliente', 'carga_item__producto', 'carga_item__carga').all().order_by('id')
    serializer_class = UnidadSerializer
    permission_classes = [IsAdminRole]
    parser_classes = [JSONParser]
    
    def get_queryset(self):
        """Filtra el queryset por código de barras si se proporciona."""
        queryset = super().get_queryset()
        codigo_barra = self.request.query_params.get('codigo_barra')
        
        if codigo_barra:
            queryset = queryset.filter(codigo_barra=codigo_barra)
        
        return queryset
    
    @decorators.action(detail=False, methods=['get'], url_path='por-codigo')
    def por_codigo(self, request):
        """Obtiene una unidad específica por su código de barras"""
        codigo_barra = request.query_params.get('codigo_barra')
        
        if not codigo_barra:
            return Response(
                {'error': 'Se requiere parámetro codigo_barra'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            unidad = Unidad.objects.select_related(
                'carga_item__carga__cliente', 
                'carga_item__producto'  # ← AÑADE ESTA RELACIÓN
            ).get(codigo_barra=codigo_barra)
            
            serializer = self.get_serializer(unidad)
            return Response(serializer.data)
            
        except Unidad.DoesNotExist:
            return Response(
                {'error': 'Unidad no encontrada'},
                status=status.HTTP_404_NOT_FOUND
        )
