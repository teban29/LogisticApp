from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Usuario
from .serializers import UsuarioCRUDSerializer
from .permissions import IsAdminRole

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('id')
    serializer_class = UsuarioCRUDSerializer
    permission_classes = [IsAdminRole]

    # Filtros y búsqueda
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['username', 'nombre', 'apellido']
    filterset_fields = ['rol', 'is_active']
    ordering_fields = ['id', 'username', 'nombre', 'apellido']
