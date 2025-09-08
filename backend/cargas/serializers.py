# cargas/serializers.py
import json
from rest_framework import serializers
from django.db import transaction
from .models import Carga, CargaItem, Unidad, Producto

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = ['id', 'sku', 'nombre', 'unidad', 'peso_kg', 'is_active', 'created_at', 'updated_at']

class UnidadSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='carga_item.carga.cliente.nombre', read_only=True)
    cliente_id = serializers.IntegerField(source='carga_item.carga.cliente.id', read_only=True)
    producto_nombre = serializers.CharField(source='carga_item.producto.nombre', read_only=True)
    producto_sku = serializers.CharField(source='carga_item.producto.sku', read_only=True)
    
    class Meta:
        model = Unidad
        fields = ['id', 'codigo_barra', 'estado', 'cliente_nombre', 'cliente_id', 'producto_nombre', 'producto_sku', 'created_at']

class CargaItemWriteSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField(required=False)
    producto_nombre = serializers.CharField(required=False, allow_blank=False)
    producto_sku = serializers.CharField(required=False, allow_blank=True)
    cantidad = serializers.IntegerField(min_value=1)
    notas = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs.get('producto_id') and not attrs.get('producto_nombre'):
            raise serializers.ValidationError('Debe indicar producto_id o producto_nombre.')
        return attrs

class CargaItemReadSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer()
    unidades_count = serializers.IntegerField(source='unidades.count', read_only=True)

    class Meta:
        model = CargaItem
        fields = ['id', 'producto', 'cantidad', 'unidades_count', 'created_at']

class CargaSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField(read_only=True)
    items_data = serializers.JSONField(write_only=True, required=False)
    auto_generar_unidades = serializers.BooleanField(write_only=True, required=False, default=True)

    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)

    class Meta:
        model = Carga
        fields = [
            'id', 'cliente', 'cliente_nombre', 'proveedor', 'proveedor_nombre',
            'remision', 'factura', 'observaciones', 'estado',
            'items', 'items_data', 'auto_generar_unidades',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['estado', 'created_at', 'updated_at']

    def get_items(self, obj):
        return [
            {
                'id': it.id,
                'producto': {
                    'id': it.producto_id,
                    'sku': it.producto.sku,
                    'nombre': it.producto.nombre,
                    'unidad': it.producto.unidad,
                },
                'cantidad': it.cantidad,
                'unidades_count': it.unidades.count(),
                'created_at': it.created_at,
            }
            for it in obj.items.select_related('producto')
        ]

    @transaction.atomic
    def create(self, validated_data):
        """
        Validamos items usando CargaItemWriteSerializer(many=True) — así damos mensajes claros.
        items_data puede venir como lista (JSON) o como cadena (JSON): JSONField ya lo maneja.
        """
        items_raw = validated_data.pop('items_data', []) or []
        auto = validated_data.pop('auto_generar_unidades', True)
        carga = Carga.objects.create(**validated_data)

        # Validar items explícitamente
        item_serializer = CargaItemWriteSerializer(data=items_raw, many=True)
        item_serializer.is_valid(raise_exception=True)
        items_valid = item_serializer.validated_data  # lista de dicts

        items_to_create = []
        for it in items_valid:
            # Resolver/crear producto
            if it.get('producto_id'):
                producto = Producto.objects.get(pk=it['producto_id'])
            else:
                nombre = it['producto_nombre'].strip()
                sku = (it.get('producto_sku') or '').strip() or None
                if sku:
                    producto, _ = Producto.objects.get_or_create(
                        sku=sku,
                        defaults={'nombre': nombre, 'unidad': 'unidad'}
                    )
                else:
                    base = (nombre.upper().replace(' ', '-')[:20]) or 'SKU'
                    candidate = base
                    i = 1
                    while Producto.objects.filter(sku=candidate).exists():
                        i += 1
                        candidate = f"{base}-{i}"[:60]
                    producto = Producto.objects.create(sku=candidate, nombre=nombre, unidad='unidad')

            items_to_create.append(CargaItem(
                carga=carga,
                producto=producto,
                cantidad=it['cantidad'],
            ))

        if items_to_create:
            CargaItem.objects.bulk_create(items_to_create)

        if auto and items_to_create:
            from .services import generar_unidades_para_carga
            generar_unidades_para_carga(carga)

        return carga
    

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Actualiza la carga. Si llega 'items_data' -> reemplaza items (borrar y crear).
        Si llega factura (archivo) lo actualiza normalmente.
        """
        items_raw = validated_data.pop('items_data', None)
        # actualizar campos simples
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        # Si nos dieron items_data, reemplazamos los items
        if items_raw is not None:
            # validar items
            item_serializer = CargaItemWriteSerializer(data=items_raw, many=True)
            item_serializer.is_valid(raise_exception=True)
            items_valid = item_serializer.validated_data

            # eliminar items existentes (y sus unidades por cascade)
            instance.items.all().delete()

            items_to_create = []
            for it in items_valid:
                if it.get('producto_id'):
                    producto = Producto.objects.get(pk=it['producto_id'])
                else:
                    nombre = it['producto_nombre'].strip()
                    sku = (it.get('producto_sku') or '').strip() or None
                    if sku:
                        producto, _ = Producto.objects.get_or_create(
                            sku=sku,
                            defaults={'nombre': nombre, 'unidad': 'unidad'}
                        )
                    else:
                        base = (nombre.upper().replace(' ', '-')[:20]) or 'SKU'
                        candidate = base
                        i = 1
                        while Producto.objects.filter(sku=candidate).exists():
                            i += 1
                            candidate = f"{base}-{i}"[:60]
                        producto = Producto.objects.create(sku=candidate, nombre=nombre, unidad='unidad')

                items_to_create.append(CargaItem(
                    carga=instance,
                    producto=producto,
                    cantidad=it['cantidad'],
                ))

            if items_to_create:
                CargaItem.objects.bulk_create(items_to_create)
        return instance
