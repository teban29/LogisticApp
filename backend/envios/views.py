# Standard library imports
from re import search

# Django imports
from django.db.models import Prefetch, Q
from django.http import HttpResponse
from django.utils import timezone

# Django REST Framework imports
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

# Local imports
from .models import Envio, EnvioItem, EscaneoEntrega
from .permissions import IsAdminRole, PuedeVerEnvio, IsAdminOrConductor
from .serializers import EnvioSerializer, AgregarItemSerializer, EnvioItemSerializer, EstadoVerificacionSerializer, EscaneoEntregaSerializer,EscaneoMasivoSerializer
from .pdf_generators import generate_acta_entrega_pdf, generate_cuenta_cobro_pdf
from cargas.models import Unidad, Carga
from partners.models import Cliente

class EnvioViewSet(viewsets.ModelViewSet):
    queryset = Envio.objects.select_related('cliente').prefetch_related(
        Prefetch('items', queryset=EnvioItem.objects.select_related('unidad'))
    ).order_by('-created_at')  
    
    serializer_class = EnvioSerializer
    
    def get_permissions(self):
        """
        Permisos diferenciados por acción:
        - List/Retrieve: Admin y operador pueden ver
        - Create/Update/Delete: Solo admin
        - Acciones de verificación: Admin y conductor
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [PuedeVerEnvio]
        elif self.action == 'create':
            permission_classes = [IsAdminRole]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAdminOrConductor]
        elif self.action in ['estado_verificacion', 'items_pendientes', 'escanear_item', 'forzar_completar_entrega']:
            # Permisos para acciones de verificación
            permission_classes = [IsAdminOrConductor]
        else:
            permission_classes = [IsAdminRole]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filtra envíos por usuario, cliente, estado y búsqueda"""
        queryset = super().get_queryset()
        
        print(f"User: {self.request.user}")
        print(f"User rol: {self.request.user.rol}")
        print(f"User cliente: {self.request.user.cliente}")
        print(f"User cliente id: {self.request.user.cliente.id if self.request.user.cliente else None}")
        
        # FILTRO AUTOMÁTICO POR CLIENTE PARA USUARIOS CLIENTE
        if self.request.user.rol == 'cliente' and self.request.user.cliente:
            queryset = queryset.filter(cliente=self.request.user.cliente.id)
        
        # Obtener parámetros de filtro
        cliente_id = self.request.query_params.get('cliente_id')
        estado = self.request.query_params.get('estado')
        search = self.request.query_params.get('search')
        
        # RESTRICCIÓN: Usuarios cliente no pueden filtrar por otros clientes
        if self.request.user.rol == 'cliente' and cliente_id:
            # Ignorar filtro de cliente_id si el usuario es cliente
            # para evitar que filtren por otros clientes
            pass
        elif cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
        
        if estado:
            queryset = queryset.filter(estado=estado)
        
        if search:
            queryset = queryset.filter(
                Q(numero_guia__icontains=search) | 
                Q(cliente__nombre__icontains=search) | 
                Q(conductor__icontains=search) | 
                Q(placa_vehiculo__icontains=search)
            )
        
        # Para tests, desactivar paginación
        if getattr(self, 'swagger_fake_view', False) or self.request and self.request.method == 'GET' and 'test' in self.request.META.get('HTTP_USER_AGENT', ''):
            self.pagination_class = None
        
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
                'mensaje': 'Mostrando solo los envíos de su cliente asignado'
            }
        
        return response
    
    def partial_update(self, request, *args, **kwargs):
        """Permitir que el conductor solo cambie el estado"""
        user = request.user
        envio = self.get_object()

        # Si es conductor, solo puede modificar 'estado'
        if user.rol == "conductor":
            allowed_fields = {"estado", "observaciones"}
            if not set(request.data.keys()).issubset(allowed_fields):
                return Response(
                    {"detail": "Solo puedes cambiar el estado."},
                    status=status.HTTP_403_FORBIDDEN
                )

        return super().partial_update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
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
    
    @action(detail=True, methods=['delete'])
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
    
    @action(detail=False, methods=['get'], url_path='cargas-por-cliente')
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
    
    @action(detail=True, methods=['get'], url_path='acta-entrega')
    def acta_entrega(self, request, pk=None):
        """
        Genera un acta de entrega en PDF para el envío especificado
        """
        try:
            envio = self.get_object()
            print(f"Generando acta para envío: {envio.numero_guia}")
            
            pdf_buffer = generate_acta_entrega_pdf(envio)
            
            response = HttpResponse(
                pdf_buffer.getvalue(), 
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="acta_entrega_{envio.numero_guia}.pdf"'
            return response
            
        except Exception as e:
            print(f"Error en acta_entrega: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return Response(
                {
                    'error': 'Error al generar el acta de entrega',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], url_path='cuenta-cobro')
    def cuenta_cobro(self, request, pk=None):
        """
        Genera una cuenta de cobro en PDF para el envío especificado
        """
        try:
            envio = self.get_object()
            print(f"Generando cuenta de cobro para envío: {envio.numero_guia}")
            
            pdf_buffer = generate_cuenta_cobro_pdf(envio)
            
            response = HttpResponse(
                pdf_buffer.getvalue(), 
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="cuenta_cobro_{envio.numero_guia}.pdf"'
            return response
            
        except Exception as e:
            print(f"Error en cuenta_cobro: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return Response(
                {
                    'error': 'Error al generar la cuenta de cobro',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], url_path='estado-verificacion')
    def estado_verificacion(self, request, pk=None):
        envio = self.get_object()
        serializer = EstadoVerificacionSerializer(envio)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='escanear-item')
    def escanear_item(self, request, pk=None):
        """Escanea un item para verificación de entrega"""
        envio = self.get_object()
        
        # Validar que el envío esté en estado pendiente o en tránsito
        if envio.estado not in ['pendiente', 'en_transito']:
            return Response(
                {'error': 'Solo se pueden escanear items de envíos pendientes o en tránsito'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = EscaneoEntregaSerializer(data=request.data)
        if serializer.is_valid():
            codigo_barra = serializer.validated_data['codigo_barra']
            escaneado_por = serializer.validated_data.get('escaneado_por', '')
            
            try:
                # Buscar el item del envío por código de barras
                item = EnvioItem.objects.select_related('unidad').get(
                    envio=envio,
                    unidad__codigo_barra=codigo_barra
                )
                
                # Verificar si ya fue escaneado
                if EscaneoEntrega.objects.filter(envio=envio, item=item).exists():
                    return Response(
                        {'warning': 'Item ya fue escaneado anteriormente'},
                        status=status.HTTP_200_OK
                    )
                
                # Registrar el escaneo
                EscaneoEntrega.objects.create(
                    envio=envio,
                    item=item,
                    escaneado_por=escaneado_por
                )
                
                # Verificar si todos los items han sido escaneados
                if envio.todos_items_verificados():
                    envio.estado = 'entregado'
                    envio.fecha_entrega_verificada = timezone.now()
                    envio.save()
                    
                    # Liberar unidades (cambiar estado a despachada)
                    unidades_ids = envio.items.values_list('unidad_id', flat=True)
                    Unidad.objects.filter(id__in=unidades_ids).update(estado='despachada')
                    
                    return Response({
                        'success': '¡Entrega completada! Todos los items verificados',
                        'completado': True
                    })
                
                return Response({
                    'success': 'Item escaneado correctamente',
                    'completado': False,
                    'porcentaje': envio.porcentaje_verificacion()
                })
                
            except EnvioItem.DoesNotExist:
                return Response(
                    {'error': 'El código de barras no pertenece a este envío'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='forzar-completar-entrega')
    def forzar_completar_entrega(self, request, pk=None):
        """Forza la finalización de la entrega (para casos excepcionales)"""
        envio = self.get_object()
        
        if envio.estado not in ['pendiente', 'en_transito']:
            return Response(
                {'error': 'Solo se pueden completar envíos pendientes o en tránsito'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cambiar estado a entregado
        envio.estado = 'entregado'
        envio.fecha_entrega_verificada = timezone.now()
        envio.save()
        
        # Liberar unidades
        unidades_ids = envio.items.values_list('unidad_id', flat=True)
        Unidad.objects.filter(id__in=unidades_ids).update(estado='despachada')
        
        return Response({
            'success': 'Entrega completada manualmente',
            'completado': True
        })
    
    @action(detail=True, methods=['get'], url_path='items-pendientes')
    def items_pendientes(self, request, pk=None):
        """Obtiene la lista de items pendientes de escanear"""
        envio = self.get_object()
        
        # Obtener items ya escaneados
        items_escaneados = envio.items_escaneados.values_list('id', flat=True)
        
        # Obtener items pendientes
        items_pendientes = envio.items.exclude(id__in=items_escaneados).select_related(
            'unidad', 'unidad__carga_item__producto'
        )
        
        serializer = EnvioItemSerializer(items_pendientes, many=True)
        return Response({
            'pendientes': serializer.data,
            'total_pendientes': items_pendientes.count(),
            'total_items': envio.items.count()
        })
        
    @action(detail=False, methods=['post'], url_path='escaneo-masivo')
    def escaneo_masivo(self, request):
        """
        Endpoint para escaneo masivo de unidades.
        Agrupa automáticamente por cliente y crea un envío por cada uno.
        """
        print("=" * 50)
        print("DEBUG: Escaneo masivo action CALLED!")
        print(f"DEBUG: Method: {request.method}")
        print(f"DEBUG: User: {request.user}")
        print(f"DEBUG: Data: {request.data}")
        print("=" * 50)
            
        try:
            serializer = EscaneoMasivoSerializer(data=request.data, context={'request': request})
                
            if serializer.is_valid():
                try:
                    resultado = serializer.save()
                    print(f"DEBUG: Success! Created {len(resultado['envios_creados'])} envios")
                    return Response({
                        'message': f'Proceso completado. Se crearon {len(resultado["envios_creados"])} envíos.',
                        'envios_creados_ids': resultado['envios_creados']
                    }, status=status.HTTP_201_CREATED)
                        
                except Exception as e:
                    print(f"DEBUG: Error in serializer.save(): {str(e)}")
                    import traceback
                    traceback.print_exc()
                    return Response(
                        {'error': f'Error durante la creación de envíos: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
            else:
                print(f"DEBUG: Serializer invalid: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                    
        except Exception as e:
            print(f"DEBUG: Unexpected error in action: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

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
