from rest_framework import serializers
from .models import Usuario

class UsuarioCRUDSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'nombre', 'apellido', 'rol', 'cliente','cliente_nombre','password', 'is_active']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'cliente': {'write_only': True, 'required': False}
        }
    
    def validate(self, data):
        rol = data.get('rol')
        cliente = data.get('cliente')
        
        if rol == 'cliente' and not cliente:
            raise serializers.ValidationError("Los usuarios cliente deben tener un cliente asignado")
        if rol != 'cliente' and cliente:
            raise serializers.ValidationError("Solo los usuarios cliente pueden tener un cliente asignado")

        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
