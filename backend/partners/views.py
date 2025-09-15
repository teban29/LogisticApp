from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Cliente, Proveedor
from .serializers import ClienteSerializer, ProveedorSerializer
from .permissions import IsAdminOrReadOnlyForAuthenticated, IsAdminOrOperadorForCreate

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all().order_by('id')
    serializer_class = ProveedorSerializer
    permission_classes = [IsAdminOrOperadorForCreate]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['nombre', 'nit', 'email', 'telefono', 'ciudad']
    filterset_fields = ['is_active', 'ciudad']
    ordering_fields = ['id','nombre','nit','ciudad']

    def get_queryset(self):
        qs = super().get_queryset()
        cliente_id = self.request.query_params.get('cliente_id')
        if cliente_id:
            qs = qs.filter(clientes__id=cliente_id).distinct()

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(nombre__icontains=search) | qs.filter(nit__icontains=search)

        return qs


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('id')
    serializer_class = ClienteSerializer
    permission_classes = [IsAdminOrOperadorForCreate]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['nombre', 'nit', 'email', 'telefono', 'ciudad']
    filterset_fields = ['is_active', 'ciudad', 'proveedores']
    ordering_fields = ['id','nombre','nit','ciudad']
