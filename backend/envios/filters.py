import django_filters
from .models import Envio

class EnvioFilter(django_filters.FilterSet):
    class Meta:
        model = Envio
        fields = ['estado', 'cliente']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Aplicar filtro automático por cliente si el usuario es cliente
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and user.rol == 'cliente' and user.cliente:
            # CORRECCIÓN: usar user.cliente.id en lugar de user.cliente
            self.queryset = self.queryset.filter(cliente_id=user.cliente.id)