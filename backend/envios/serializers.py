from rest_framework import serializers
from django.db import transaction
from django.core.validators import MinValueValidator
from .models import Envio, EnvioItem
from cargas.models import Unidad
from cargas.serializers import UnidadSerializer
from partners.models import Cliente


class EnvioItemSerializer(serializers.ModelSerializer):
    codigo_barra = serializers.CharField(source='unidad.codigo_barra', read_only=True)
    producto_nombre = serializers.CharField(source='unidad.carga_item.producto.nombre', read_only=True)
    producto_sku = serializers.CharField(source='unidad.carga_item.producto.sku', read_only=True)
    unidad_detalle = UnidadSerializer(source='unidad', read_only=True)
    
    class Meta:
        model = EnvioItem
        fields = [
            'id', 'unidad', 'codigo_barra', 'producto_nombre', 
            'producto_sku', 'valor_unitario', 'unidad_detalle', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate(self, attrs):
        """Validación para usuarios cliente al crear/actualizar items"""
        request = self.context.get('request')
        
        if request and request.user.rol == 'cliente':
            # Para operaciones de creación/actualización, verificar permisos
            unidad = attrs.get('unidad')
            if unidad and hasattr(unidad, 'carga_item'):
                if unidad.carga_item.carga.cliente != request.user.cliente:
                    raise serializers.ValidationError("No tiene permisos para acceder a esta unidad")
        
        return attrs


class EnvioSerializer(serializers.ModelSerializer):
    items = EnvioItemSerializer(many=True, read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    items_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="Lista de items con formato: [{'unidad_codigo': 'CODIGO123', 'valor_unitario': 100.00}]"
    )
    
    items_agrupados = serializers.SerializerMethodField()
    
    class Meta:
        model = Envio
        fields = [
            'id', 'numero_guia', 'cliente', 'cliente_nombre', 'conductor', 
            'placa_vehiculo', 'origen', 'valor_total', 'estado', 'items', 
            'items_data', 'created_at', 'updated_at', 'items_agrupados'
        ]
        read_only_fields = ['numero_guia', 'valor_total', 'created_at', 'updated_at']

    def get_items_agrupados(self, obj):
        items = obj.items.select_related(
            'unidad__carga_item__producto',
            'unidad__carga_item__carga'
        )
        
        # Agrupar por producto y remisión
        grupos = {}
        for item in items:
            clave = f"{item.unidad.carga_item.producto.id}-{item.unidad.carga_item.carga.remision}"
            if clave not in grupos:
                grupos[clave] = {
                    'producto': item.unidad.carga_item.producto.nombre,
                    'remision': item.unidad.carga_item.carga.remision,
                    'cantidad': 0,
                    'valor_unitario': item.valor_unitario,
                    'items_ids': []
                }
            grupos[clave]['cantidad'] += 1
            grupos[clave]['items_ids'].append(item.id)
        
        return list(grupos.values())
    
    def to_representation(self, instance):
        """Sobrescribir para incluir unidad_codigo en la representación"""
        representation = super().to_representation(instance)
        
        # Incluir unidad_codigo en cada item para el frontend
        if 'items' in representation:
            for item in representation['items']:
                # Caso 1: 'unidad' es un diccionario completo
                if item.get('unidad') and isinstance(item['unidad'], dict) and 'codigo_barra' in item['unidad']:
                    item['unidad_codigo'] = item['unidad']['codigo_barra']
                
                # Caso 2: Tenemos 'unidad_detalle' con la información completa
                elif 'unidad_detalle' in item and item['unidad_detalle'] and isinstance(item['unidad_detalle'], dict):
                    item['unidad_codigo'] = item['unidad_detalle'].get('codigo_barra', '')
                
                # Caso 3: 'unidad' es solo un ID (entero) - obtener código de barras desde la base de datos
                elif item.get('unidad') and isinstance(item['unidad'], int):
                    # Opción: Obtener el código de barras desde la base de datos
                    # Pero esto podría ser costoso en términos de rendimiento
                    try:
                        from cargas.models import Unidad
                        unidad = Unidad.objects.get(id=item['unidad'])
                        item['unidad_codigo'] = unidad.codigo_barra
                    except Unidad.DoesNotExist:
                        item['unidad_codigo'] = ''
                else:
                    item['unidad_codigo'] = ''
        
            return representation
    
    def validate_cliente(self, value):
        """Valida que el cliente esté activo y sea el asignado al usuario"""
        request = self.context.get('request')
        
        if request and request.user.rol == 'cliente':
            # Usuarios cliente solo pueden asignar su propio cliente
            if value != request.user.cliente:
                raise serializers.ValidationError("Solo puede crear envíos para su cliente asignado")
        
        if not value.is_active:
            raise serializers.ValidationError("El cliente no está activo")
        
        return value

    def validate(self, attrs):
        """Validación general para operaciones de cliente"""
        request = self.context.get('request')
        
        if request and request.user.rol == 'cliente':
            # Para operaciones de update, verificar que el envío pertenece al cliente
            if self.instance and self.instance.cliente != request.user.cliente:
                raise serializers.ValidationError("No tiene permisos para modificar este envío")
            
            # Para create, asegurar que el cliente es el asignado al usuario
            if not self.instance and attrs.get('cliente') != request.user.cliente:
                raise serializers.ValidationError("Solo puede crear envíos para su cliente asignado")
        
        return attrs
    
    def validate_items_data(self, value):
        """Valida la estructura de items_data y que las unidades pertenezcan al cliente"""
        request = self.context.get('request')
        
        for item in value:
            if 'unidad_codigo' not in item:
                raise serializers.ValidationError("Cada item debe tener unidad_codigo")
            if 'valor_unitario' not in item:
                raise serializers.ValidationError("Cada item debe tener valor_unitario")
            try:
                # Convertir a float para validación
                valor = float(item['valor_unitario'])
                if valor < 0:
                    raise serializers.ValidationError("valor_unitario no puede ser negativo")
            except (ValueError, TypeError):
                raise serializers.ValidationError("valor_unitario debe ser un número válido")
        
        # Validación adicional para usuarios cliente
        if request and request.user.rol == 'cliente':
            for item in value:
                codigo_barra = item['unidad_codigo']
                try:
                    unidad = Unidad.objects.select_related(
                        'carga_item__carga__cliente'
                    ).get(codigo_barra=codigo_barra)
                    
                    # Verificar que la unidad pertenece al cliente del usuario
                    if unidad.carga_item.carga.cliente != request.user.cliente:
                        raise serializers.ValidationError(
                            f"La unidad {codigo_barra} no pertenece a su cliente"
                        )
                        
                except Unidad.DoesNotExist:
                    # Esta validación ya se hace en el método _crear_items
                    pass
        
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items_data', [])
        envio = Envio.objects.create(**validated_data)
        
        if items_data:
            self._crear_items(envio, items_data)
            # No cambiar estado aquí, se hará en la señal post_save
        
        return envio
    
    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items_data', None)
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Si se proporcionan items, reemplazar todos los existentes
        if items_data is not None:
            # Guardar IDs de unidades actuales para liberarlas
            unidades_actuales = list(instance.items.values_list('unidad_id', flat=True))
            
            # Eliminar items existentes
            instance.items.all().delete()
            
            # Liberar unidades anteriores
            Unidad.objects.filter(id__in=unidades_actuales).update(estado='disponible')
            
            # Crear nuevos items si los hay
            if items_data:
                self._crear_items(instance, items_data)
        
        return instance
    
    def _crear_items(self, envio, items_data):
        """Método helper para crear items del envío"""
        items_to_create = []
        unidades_ids = []

        for item_data in items_data:
            codigo_barra = item_data.get('unidad_codigo')
            valor_unitario = item_data['valor_unitario']

            try:
                unidad = Unidad.objects.select_related(
                    'carga_item__carga__cliente'
                ).get(codigo_barra=codigo_barra)
            except Unidad.DoesNotExist:
                raise serializers.ValidationError(f"Unidad con código {codigo_barra} no existe")

            if unidad.carga_item.carga.cliente_id != envio.cliente_id:
                raise serializers.ValidationError(
                    f"La unidad {unidad.codigo_barra} no pertenece al cliente {envio.cliente.nombre}"
                )

            if unidad.id in unidades_ids:
                raise serializers.ValidationError(f"Unidad {unidad.codigo_barra} duplicada en el envío")

            if unidad.estado != 'disponible':
                raise serializers.ValidationError(
                    f"La unidad {unidad.codigo_barra} no está disponible. Estado actual: {unidad.estado}"
                )

            if EnvioItem.objects.filter(unidad=unidad, envio__estado__in=['borrador', 'pendiente']).exists():
                raise serializers.ValidationError(
                    f"La unidad {unidad.codigo_barra} ya está asignada a otro envío"
                )

            unidades_ids.append(unidad.id)
            items_to_create.append(EnvioItem(
                envio=envio,
                unidad=unidad,
                valor_unitario=valor_unitario
            ))

        if items_to_create:
            EnvioItem.objects.bulk_create(items_to_create)
            Unidad.objects.filter(id__in=unidades_ids).update(estado='reservada')
            if envio.estado == 'borrador':
                envio.estado = 'pendiente'
                envio.save(update_fields=['estado'])


class AgregarItemSerializer(serializers.Serializer):
    codigo_barra = serializers.CharField(max_length=64)
    valor_unitario = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)]
    )
    
    def validate_codigo_barra(self, value):
        """Valida que el código de barras exista y pertenezca al cliente del usuario"""
        request = self.context.get('request')
        
        if not Unidad.objects.filter(codigo_barra=value).exists():
            raise serializers.ValidationError("Código de barras no encontrado")
        
        if request and request.user.rol == 'cliente':
            # Verificar que la unidad pertenece al cliente del usuario
            try:
                unidad = Unidad.objects.select_related(
                    'carga_item__carga__cliente'
                ).get(codigo_barra=value)
                
                if unidad.carga_item.carga.cliente != request.user.cliente:
                    raise serializers.ValidationError("La unidad no pertenece a su cliente")
                    
            except Unidad.DoesNotExist:
                pass  # Ya se validó que existe
        
        return value
    

class EscaneoMasivoSerializer(serializers.Serializer):
    """Serializer para procesar una lista de codigos de barras y crear envios automaticamente agrupados por cliente."""
    codigos_barras = serializers.ListField(
        child=serializers.CharField(max_length=64),
        min_length=1,
        help_text="Lista de codigos de barras escaneados."
    )
    conductor = serializers.CharField(max_length=100, required=False, default="")
    placa_vehiculo = serializers.CharField(max_length=100, required=False, default="")
    origen = serializers.CharField(max_length=100, required=False, default="")
    
    def validate_codigos_barras(self, value):
        """Valida que los codigos de barras existan y estén disponibles"""
        unidades_existentes = Unidad.objects.filter(codigo_barra__in=value).values_list('codigo_barra', flat=True)
        codigos_inexistentes = set(value) - set(unidades_existentes)
        
        if codigos_inexistentes:
            raise serializers.ValidationError(f"Codigos no encontrados: {list(codigos_inexistentes)}")
        
        # Validación de disponibilidad
        unidades_no_disponibles = Unidad.objects.filter(
            codigo_barra__in=value
        ).exclude(estado='disponible').values_list('codigo_barra', flat=True)
        
        if unidades_no_disponibles:
            raise serializers.ValidationError(
                f"Unidades no disponibles: {list(unidades_no_disponibles)}"
            )
        
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        # Obtener los datos del contexto (forma correcta)
        request = self.context.get('request')
        codigos = validated_data['codigos_barras']
        
        # Usar los datos validados, no request.data
        datos_envio_base = {
            'conductor': validated_data.get('conductor', ''),
            'placa_vehiculo': validated_data.get('placa_vehiculo', ''),
            'origen': validated_data.get('origen', '')
        }
        
        # Obtener y agrupar unidades por cliente
        unidades = Unidad.objects.select_related(
            'carga_item__carga__cliente'
        ).filter(codigo_barra__in=codigos)
        
        # Agrupar unidades por cliente_id
        unidades_por_cliente = {}
        for unidad in unidades:
            cliente_id = unidad.carga_item.carga.cliente_id
            if cliente_id not in unidades_por_cliente:
                unidades_por_cliente[cliente_id] = []
            unidades_por_cliente[cliente_id].append(unidad)
            
        # Crear un envio por cada cliente
        envios_creados = []
        for cliente_id, lista_unidades in unidades_por_cliente.items():
            cliente = Cliente.objects.get(id=cliente_id)
            
            # Crear el envio para este cliente
            envio = Envio.objects.create(
                cliente=cliente,
                **datos_envio_base
            )
            envios_creados.append(envio.id)
            
            # Crear los EnvioItem y vincular las unidades
            items_a_crear = []
            ids_unidades_a_reservar = []
            
            for unidad in lista_unidades:
                # Determinar valor unitario (puedes cambiar esta lógica)
                valor_unitario = 0
                
                items_a_crear.append(EnvioItem(
                    envio=envio,
                    unidad=unidad,
                    valor_unitario=valor_unitario
                ))
                ids_unidades_a_reservar.append(unidad.id)
                
            # Crear todos los items de este envio de una vez
            if items_a_crear:
                EnvioItem.objects.bulk_create(items_a_crear)
                # Actualizar estado de todas las unidades de este envio a 'reservada'
                Unidad.objects.filter(id__in=ids_unidades_a_reservar).update(estado='reservada')
                
                # Actualizar estado del envio
                envio.estado = 'pendiente'
                envio.save(update_fields=['estado'])
        
        return {'envios_creados': envios_creados}

class EscaneoEntregaSerializer(serializers.Serializer):
    codigo_barra = serializers.CharField(max_length=64)
    escaneado_por = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    
    def validate_codigo_barra(self, value):
        """Valida que el código de barras exista y pertenezca a un envío"""
        if not Unidad.objects.filter(codigo_barra=value).exists():
            raise serializers.ValidationError("Código de barras no encontrado")
        return value

class EstadoVerificacionSerializer(serializers.ModelSerializer):
    porcentaje_verificacion = serializers.SerializerMethodField()
    items_totales = serializers.SerializerMethodField()
    items_escaneados = serializers.SerializerMethodField()
    items_pendientes = serializers.SerializerMethodField()
    
    class Meta:
        model = Envio
        fields = [
            'id', 'numero_guia', 'estado', 'porcentaje_verificacion',
            'items_totales', 'items_escaneados', 'items_pendientes',
            'fecha_entrega_verificada'
        ]
    
    def get_porcentaje_verificacion(self, obj):
        return obj.porcentaje_verificacion()
    
    def get_items_totales(self, obj):
        return obj.items.count()
    
    def get_items_escaneados(self, obj):
        return obj.items_escaneados.count()
    
    def get_items_pendientes(self, obj):
        return obj.items.count() - obj.items_escaneados.count()