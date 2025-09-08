from rest_framework import viewsets, decorators, response, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Prefetch
from django.http import HttpResponse
from .models import Carga, Unidad, CargaItem, Producto
from .serializers import CargaSerializer, UnidadSerializer, ProductoSerializer
from .permissions import IsAdminRole
from .services import generar_unidades_para_carga

from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import mm, landscape
from reportlab.graphics.barcode import code128
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.enums import TA_CENTER

from rest_framework.response import Response
from rest_framework import status, decorators



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
    Solo accesible por usuarios con rol de administrador.
    """
    queryset = (
        Carga.objects
        .select_related('cliente', 'proveedor')
        .prefetch_related(Prefetch('items', queryset=CargaItem.objects.select_related('producto')))
        .order_by('-created_at')
    )
    serializer_class = CargaSerializer
    permission_classes = [IsAdminRole]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    @decorators.action(detail=True, methods=['post'])
    def generar_unidades(self, request, pk=None):
        """
        Genera unidades para una carga específica.
        """
        carga = self.get_object()
        generar_unidades_para_carga(carga)
        return response.Response(
            {'detail': 'Unidades generadas'}, 
            status=status.HTTP_200_OK
        )
    
    @decorators.action(detail=True, methods=['get'], url_path='etiquetas')
    def etiquetas(self, request, pk=None):
        """
        GET /api/cargas/<id>/etiquetas/?item_id=XX
        1 unidad = 1 página (100x80mm, landscape)
        - Barcode EXACTO: 85mm ancho x 44mm alto, centrado
        - Tipografía: Helvetica, 12pt (líneas), 11pt (ID)
        """
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

        # Medidas del barcode requeridas
        target_bw = 85*mm
        target_bh = 44*mm

        for u in unidades:
            producto = u.carga_item.producto
            cliente = u.carga_item.carga.cliente

            codigo = u.codigo_barra
            bcode = code128.Code128(codigo, barHeight=target_bh)
            nat_w, nat_h = bcode.wrap(0, 0)

            sx = float(target_bw) / float(nat_w) if nat_w else 1.0
            sy = float(target_bh) / float(nat_h) if nat_h else 1.0

            s = None

            bx = (label_w - target_bw) / 2.0
            by = label_h - margin - target_bh - (4*mm)

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
    queryset = Unidad.objects.select_related('carga_item__carga__cliente', 'carga_item__producto').all().order_by('id')
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
