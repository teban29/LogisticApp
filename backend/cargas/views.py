from rest_framework import viewsets, decorators, response, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Prefetch

from .models import Carga, Unidad, CargaItem, Producto
from .serializers import CargaSerializer, UnidadSerializer, ProductoSerializer
from .permissions import IsAdminRole
from .services import generar_unidades_para_carga

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('id')
    serializer_class = ProductoSerializer
    permission_classes = [IsAdminRole]
    parser_classes = [JSONParser, MultiPartParser, FormParser]  # Agrega parsers aquí también


class CargaViewSet(viewsets.ModelViewSet):
    queryset = (
        Carga.objects
        .select_related('cliente', 'proveedor')
        .prefetch_related(Prefetch('items', queryset=CargaItem.objects.select_related('producto')))
        .order_by('-created_at')
    )
    serializer_class = CargaSerializer
    permission_classes = [IsAdminRole]
    parser_classes = [JSONParser, MultiPartParser, FormParser]  # Agrega JSONParser aquí
    
    @decorators.action(detail=True, methods=['post'])
    def generar_unidades(self, request, pk=None):
        carga = self.get_object()
        generar_unidades_para_carga(carga)
        return response.Response({'detail': 'Unidades generadas'}, status=status.HTTP_200_OK)


class UnidadViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Unidad.objects.select_related('carga_item__carga').all().order_by('id')
    serializer_class = UnidadSerializer
    permission_classes = [IsAdminRole]
    parser_classes = [JSONParser]  # Agrega parser para consistencia

    def get_queryset(self):
        qs = super().get_queryset()
        code = self.request.query_params.get('codigo_barra')
        if code:
            qs = qs.filter(codigo_barra=code)
        return qs
    
