from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Cliente, Proveedor
from .serializers import ClienteSerializer, ProveedorSerializer
from .permissions import IsAdminOrReadOnlyForAuthenticated

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all().order_by('id')
    serializer_class = ProveedorSerializer
    permission_classes = [IsAdminOrReadOnlyForAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['nombre', 'nit', 'email', 'telefono', 'ciudad']
    filterset_fields = ['is_active', 'ciudad']
    ordering_fields = ['id','nombre','nit','ciudad']

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('id')
    serializer_class = ClienteSerializer
    permission_classes = [IsAdminOrReadOnlyForAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['nombre', 'nit', 'email', 'telefono', 'ciudad']
    filterset_fields = ['is_active', 'ciudad', 'proveedores']
    ordering_fields = ['id','nombre','nit','ciudad']
