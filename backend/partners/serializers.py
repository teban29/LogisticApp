from rest_framework import serializers
from .models import Cliente, Proveedor

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = ['id','nombre','nit','email','telefono','direccion','ciudad','is_active','created_at']

class ClienteSerializer(serializers.ModelSerializer):
    proveedores = ProveedorSerializer(many=True, read_only=True)
    proveedores_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Proveedor.objects.all(),
        write_only=True,
        source='proveedores',
        required=False
    )

    class Meta:
        model = Cliente
        fields = [
            'id', 'nombre', 'nit', 'email', 'telefono', 'direccion', 'ciudad',
            'is_active', 'proveedores', 'proveedores_ids', 'created_at',
        ]


    def create(self, validated_data):
        proveedores = validated_data.pop('proveedores', [])
        cliente = Cliente.objects.create(**validated_data)
        if proveedores:
            cliente.proveedores.set(proveedores)
        return cliente

    def update(self, instance, validated_data):
        proveedores = validated_data.pop('proveedores', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if proveedores is not None:
            instance.proveedores.set(proveedores)
        return instance
