from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q, F, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta, datetime
from dateutil.relativedelta import relativedelta
from cargas.models import Carga, CargaItem
from envios.models import Envio, EnvioItem
from partners.models import Cliente, Proveedor
import logging

logger = logging.getLogger(__name__)

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def _get_user_filters(self, user):
        """Aplica filtros según el rol del usuario"""
        filters = Q()
        if user.rol == 'cliente' and user.cliente:
            # Para cliente, solo puede ver sus propias cargas y envíos
            filters &= Q(cliente=user.cliente)
        elif user.rol == 'conductor':
            # Conductores podrían tener filtros específicos si es necesario
            pass
        elif user.rol == 'operador':
            # Operadores pueden ver todo normalmente
            pass
        # Admin también ve todo
        return filters
    
    def _get_user_filters_proveedores(self, user):
        """Filtros específicos para proveedores según el rol del usuario"""
        filters = Q()
        if user.rol == 'cliente' and user.cliente:
            # Para cliente, solo puede ver proveedores que tienen cargas con su cliente
            # Primero obtenemos los proveedores que tienen cargas con este cliente
            proveedores_ids = Carga.objects.filter(
                cliente=user.cliente
            ).values_list('proveedor_id', flat=True).distinct()
            filters &= Q(id__in=proveedores_ids)
        return filters
    
    def _aplicar_filtros_tiempo(self, queryset, time_filter):
        """Aplica filtros de tiempo al queryset"""
        now = timezone.now()
        
        if time_filter == 'today':
            return queryset.filter(created_at__date=now.date())
        elif time_filter == 'week':
            start_date = now - timedelta(days=now.weekday())
            return queryset.filter(created_at__date__gte=start_date.date())
        elif time_filter == 'month':
            return queryset.filter(created_at__month=now.month, created_at__year=now.year)
        elif time_filter == 'year':
            return queryset.filter(created_at__year=now.year)
        elif time_filter == 'all_time':
            return queryset
        return queryset
    
    def _aplicar_filtros_cliente_proveedor(self, queryset, filters, cliente_id=None, proveedor_id=None):
        """Aplica filtros de cliente y proveedor"""
        if cliente_id:
            filters &= Q(cliente_id=cliente_id)
        if proveedor_id:
            filters &= Q(proveedor_id=proveedor_id)
        return queryset.filter(filters)
    
    @action(detail=False, methods=['get'])
    def estadisticas_generales(self, request):
        user = request.user
        time_filter = request.GET.get('time_filter', 'all_time')
        cliente_id = request.GET.get('cliente_id')
        proveedor_id = request.GET.get('proveedor_id')
        
        user_filters = self._get_user_filters(user)
        
        # Estadísticas de cargas
        cargas_qs = Carga.objects.filter(user_filters)
        cargas_qs = self._aplicar_filtros_tiempo(cargas_qs, time_filter)
        cargas_qs = self._aplicar_filtros_cliente_proveedor(cargas_qs, user_filters, cliente_id, proveedor_id)
        
        # Estadísticas de envíos
        envios_qs = Envio.objects.filter(user_filters)
        envios_qs = self._aplicar_filtros_tiempo(envios_qs, time_filter)
        if cliente_id:
            envios_qs = envios_qs.filter(cliente_id=cliente_id)
        
        # Para usuarios cliente, no mostrar estadísticas de total clientes/proveedores
        stats = {
            'total_cargas': cargas_qs.count(),
            'total_envios': envios_qs.count(),
            'cargas_por_estado': dict(cargas_qs.values_list('estado').annotate(count=Count('id'))),
            'envios_por_estado': dict(envios_qs.values_list('estado').annotate(count=Count('id'))),
        }
        
        # Solo agregar total_clientes y total_proveedores si no es cliente
        if user.rol != 'cliente':
            clientes_qs = Cliente.objects.filter(user_filters)
            proveedores_qs = Proveedor.objects.filter(user_filters)
            stats['total_clientes'] = clientes_qs.count()
            stats['total_proveedores'] = proveedores_qs.count()
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def top_clientes(self, request):
        user = request.user
        time_filter = request.GET.get('time_filter', 'all_time')
        limit = int(request.GET.get('limit', 5))
        
        # Para usuarios cliente, no mostrar top clientes (solo ven su propio cliente)
        if user.rol == 'cliente':
            return Response({
                'top_clientes_cargas': [],
                'top_clientes_envios': []
            })
        
        user_filters = self._get_user_filters(user)
        
        # Top clientes por número de cargas (solo para admin/operador)
        cargas_qs = Carga.objects.filter(user_filters)
        cargas_qs = self._aplicar_filtros_tiempo(cargas_qs, time_filter)
        
        top_clientes_cargas = (
            cargas_qs.values('cliente_id', 'cliente__nombre')
            .annotate(total_cargas=Count('id'), total_items=Sum('items__cantidad'))
            .order_by('-total_cargas')[:limit]
        )
        
        # Formatear con nombres consistentes
        clientes_cargas_formatted = []
        for cliente in top_clientes_cargas:
            clientes_cargas_formatted.append({
                'cliente_id': cliente['cliente_id'],
                'cliente_nombre': cliente['cliente__nombre'],
                'total_cargas': cliente['total_cargas'],
                'total_items': cliente['total_items'] or 0
            })
        
        # Top clientes por número de envíos (solo para admin/operador)
        envios_qs = Envio.objects.filter(user_filters)
        envios_qs = self._aplicar_filtros_tiempo(envios_qs, time_filter)
        
        top_clientes_envios = (
            envios_qs.values('cliente_id', 'cliente__nombre')
            .annotate(total_envios=Count('id'), valor_total=Sum('valor_total'))
            .order_by('-total_envios')[:limit]
        )
        
        # Formatear con nombres consistentes
        clientes_envios_formatted = []
        for cliente in top_clientes_envios:
            clientes_envios_formatted.append({
                'cliente_id': cliente['cliente_id'],
                'cliente_nombre': cliente['cliente__nombre'],
                'total_envios': cliente['total_envios'],
                'valor_total': cliente['valor_total'] or 0
            })
        
        return Response({
            'top_clientes_cargas': clientes_cargas_formatted,
            'top_clientes_envios': clientes_envios_formatted
        })
    
    @action(detail=False, methods=['get'])
    def top_proveedores(self, request):
        user = request.user
        time_filter = request.GET.get('time_filter', 'all_time')
        limit = int(request.GET.get('limit', 5))
        
        # Para usuarios cliente, no mostrar top proveedores
        if user.rol == 'cliente':
            return Response({
                'top_proveedores': []
            })
        
        # Consulta base de cargas
        cargas_qs = Carga.objects.all()
        
        # Aplicar filtros de tiempo
        cargas_qs = self._aplicar_filtros_tiempo(cargas_qs, time_filter)
        
        # Aplicar filtros de usuario
        if user.rol == 'cliente' and user.cliente:
            cargas_qs = cargas_qs.filter(cliente=user.cliente)
        
        # Agrupar por proveedor y contar
        top_proveedores = (
            cargas_qs.values(
                'proveedor_id',
                'proveedor__nombre'
            )
            .annotate(
                total_cargas=Count('id'),
                total_items=Sum('items__cantidad')
            )
            .order_by('-total_cargas')[:limit]
        )
        
        # Formatear el resultado con nombres consistentes
        result = []
        for prov in top_proveedores:
            result.append({
                'proveedor_id': prov['proveedor_id'],
                'proveedor_nombre': prov['proveedor__nombre'],
                'total_cargas': prov['total_cargas'],
                'total_items': prov['total_items'] or 0
            })
        
        return Response({
            'top_proveedores': result
        })
    
    @action(detail=False, methods=['get'])
    def datos_graficos(self, request):
        user = request.user
        time_filter = request.GET.get('time_filter', 'month')
        cliente_id = request.GET.get('cliente_id')
        proveedor_id = request.GET.get('proveedor_id')
        
        user_filters = self._get_user_filters(user)
        
        # Datos para gráfico de evolución temporal
        now = timezone.now()
        if time_filter == 'month':
            days = 30
            date_format = '%Y-%m-%d'
        elif time_filter == 'year':
            days = 365
            date_format = '%Y-%m'
        else:
            days = 7
            date_format = '%Y-%m-%d'
        
        dates = []
        cargas_data = []
        envios_data = []
        
        for i in range(days, -1, -1):
            current_date = now - timedelta(days=i)
            if time_filter == 'year':
                date_str = current_date.strftime('%Y-%m')
            else:
                date_str = current_date.strftime('%Y-%m-%d')
            
            dates.append(date_str)
            
            # Cargas por fecha
            cargas_count = Carga.objects.filter(
                user_filters,
                created_at__date=current_date.date()
            ).count()
            cargas_data.append(cargas_count)
            
            # Envíos por fecha
            envios_count = Envio.objects.filter(
                user_filters,
                created_at__date=current_date.date()
            ).count()
            envios_data.append(envios_count)
        
        return Response({
            'dates': dates,
            'cargas': cargas_data,
            'envios': envios_data
        })
    
    @action(detail=False, methods=['get'])
    def opciones_filtros(self, request):
        user = request.user
        
        # Para usuarios cliente, solo mostrar su propio cliente
        if user.rol == 'cliente' and user.cliente:
            clientes = [{'id': user.cliente.id, 'nombre': user.cliente.nombre}]
            # Proveedores asociados a su cliente
            proveedores_ids = Carga.objects.filter(
                cliente=user.cliente
            ).values_list('proveedor_id', flat=True).distinct()
            proveedores = Proveedor.objects.filter(id__in=proveedores_ids).values('id', 'nombre')
        else:
            # Para otros roles, mostrar todos los clientes/proveedores según permisos
            user_filters = self._get_user_filters(user)
            clientes = Cliente.objects.filter(user_filters).values('id', 'nombre')
            
            user_filters_proveedores = self._get_user_filters_proveedores(user)
            proveedores = Proveedor.objects.filter(user_filters_proveedores).values('id', 'nombre')
        
        return Response({
            'clientes': list(clientes),
            'proveedores': list(proveedores),
            'time_filters': [
                {'value': 'today', 'label': 'Hoy'},
                {'value': 'week', 'label': 'Esta semana'},
                {'value': 'month', 'label': 'Este mes'},
                {'value': 'year', 'label': 'Este año'},
                {'value': 'all_time', 'label': 'Todo el tiempo'}
            ]
        })
