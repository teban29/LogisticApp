import django_filters 
from .models import Carga

class CargaFilter(django_filters.FilterSet):
    class Meta:
        model = Carga
        fields = ['estado', 'cliente']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = getattr(self.request, 'user', None)
        if user and not user.is_authenticated and user.rol == 'cliente' and user.cliente:
            self.queryset = self.queryset.filter(cliente=user.cliente)
