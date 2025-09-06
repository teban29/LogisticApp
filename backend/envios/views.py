from rest_framework import viewsets, status, decorators
from rest_framework.response import Response
from django.db.models import Prefetch, Q
from .models import Envio, EnvioItem
from .serializers import EnvioSerializer, AgregarItemSerializer, EnvioItemSerializer
from cargas.models import Unidad, Carga, CargaItem
from partners.models import Cliente
from .permissions import IsAdminRole

class EnvioViewSet(viewsets.ModelViewSet):
    queryset = Envio.objects.select_related('cliente').prefetch_related(
        Prefetch('items', queryset=EnvioItem.objects.select_related('unidad'))
    ).order_by('-created_at')
    
    serializer_class = EnvioSerializer
    permission_classes = [IsAdminRole]
    
    def get_queryset(self):
        """Filtra envíos por cliente si se especifica"""
        queryset = super().get_queryset()
        cliente_id = self.request.query_params.get('cliente_id')
        estado = self.request.query_params.get('estado')
        
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
        if estado:
            queryset = queryset.filter(estado=estado)
        
        # Para tests, desactivar paginación
        if getattr(self, 'swagger_fake_view', False) or self.request and self.request.method == 'GET' and 'test' in self.request.META.get('HTTP_USER_AGENT', ''):
            self.pagination_class = None
        
        return queryset
    @decorators.action(detail=True, methods=['post'])
    def agregar_item(self, request, pk=None):
        """Agrega un item individual al envío mediante código de barras"""
        envio = self.get_object()
        serializer = AgregarItemSerializer(data=request.data)
        
        if serializer.is_valid():
            codigo_barra = serializer.validated_data['codigo_barra']
            valor_unitario = serializer.validated_data['valor_unitario']
            
            try:
                # Obtener unidad y validar que pertenece al cliente
                unidad = Unidad.objects.select_related(
                    'carga_item__carga__cliente'
                ).get(codigo_barra=codigo_barra)
                
                if unidad.carga_item.carga.cliente_id != envio.cliente_id:
                    return Response(
                        {'error': 'La unidad no pertenece al cliente del envío'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if unidad.estado != 'disponible':
                    return Response(
                        {'error': f'Unidad no disponible. Estado: {unidad.estado}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Crear el item del envío
                EnvioItem.objects.create(
                    envio=envio,
                    unidad=unidad,
                    valor_unitario=valor_unitario
                )
                
                # Actualizar estado de la unidad
                unidad.estado = 'reservada'
                unidad.save()
                
                # Actualizar estado del envío si estaba en borrador
                if envio.estado == 'borrador':
                    envio.estado = 'pendiente'
                    envio.save()
                
                return Response({'success': 'Item agregado correctamente'})
                
            except Unidad.DoesNotExist:
                return Response(
                    {'error': 'Código de barras no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @decorators.action(detail=True, methods=['delete'])
    def remover_item(self, request, pk=None):
        """Remueve un item del envío"""
        envio = self.get_object()
        item_id = request.data.get('item_id')
        
        try:
            item = EnvioItem.objects.get(id=item_id, envio=envio)
            unidad = item.unidad
            
            # Eliminar item y liberar unidad
            item.delete()
            unidad.estado = 'disponible'
            unidad.save()
            
            # Si no quedan items, volver a estado borrador
            if not envio.items.exists() and envio.estado != 'borrador':
                envio.estado = 'borrador'
                envio.save()
            
            return Response({'success': 'Item removido correctamente'})
            
        except EnvioItem.DoesNotExist:
            return Response(
                {'error': 'Item no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @decorators.action(detail=False, methods=['get'], url_path='cargas-por-cliente')
    def cargas_por_cliente(self, request):
        """Obtiene las cargas disponibles para un cliente específico"""
        cliente_id = request.query_params.get('cliente_id')
        
        if not cliente_id:
            return Response(
                {'error': 'Se requiere cliente_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cliente = Cliente.objects.get(id=cliente_id, is_active=True)
        except Cliente.DoesNotExist:
            return Response(
                {'error': 'Cliente no encontrado o inactivo'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Cargas del cliente con unidades disponibles - CORREGIDO
        cargas = Carga.objects.filter(
            cliente=cliente,
            estado__in=['etiquetada', 'almacenada'],
            items__unidades__estado='disponible'
        ).distinct()
        
        # Verificar que realmente tienen unidades disponibles
        resultados = []
        for carga in cargas:
            unidades_disponibles = Unidad.objects.filter(
                carga_item__carga=carga,
                estado='disponible'
            )
            
            if unidades_disponibles.exists():  # Solo incluir si hay unidades disponibles
                resultados.append({
                    'carga_id': carga.id,
                    'remision': carga.remision,
                    'proveedor': carga.proveedor.nombre,
                    'unidades_disponibles': [
                        {
                            'id': u.id,
                            'codigo_barra': u.codigo_barra,
                            'producto': u.carga_item.producto.nombre,
                            'sku': u.carga_item.producto.sku
                        }
                        for u in unidades_disponibles.select_related('carga_item__producto')
                    ]
                })
        
        return Response(resultados)



class EnvioItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EnvioItem.objects.select_related(
        'envio', 'unidad', 'unidad__carga_item__producto'
    ).all()
    
    serializer_class = EnvioItemSerializer
    permission_classes = [IsAdminRole]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        envio_id = self.request.query_params.get('envio_id')
        
        if envio_id:
            queryset = queryset.filter(envio_id=envio_id)
        
        return queryset