from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, username, password, nombre, apellido, rol, cliente=None, **extra_fields):
        if not username:
            raise ValueError("El nombre de usuario es obligatorio")
        if not password:
            raise ValueError("La contraseña es obligatoria")
        
        if rol == 'cliente' and not cliente:
            raise ValueError("Los usuarios cliente deben tener un cliente asignado")
        if rol != 'cliente' and cliente:
            raise ValueError("Solo los usuarios cliente pueden tener un cliente asignado")

        user = self.model(
            username=username,
            nombre=nombre,
            apellido=apellido,
            rol=rol,
            cliente=cliente,
            **extra_fields
        )
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, username, password, nombre="Admin", apellido="Admin", rol="admin", **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(username, password, nombre, apellido, rol, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    ROLES = (
        ('admin', 'Administrador'),
        ('conductor', 'Conductor'),
        ('operador', 'Operador'),
        ('cliente', 'Cliente'),
    )

    username = models.CharField(max_length=150, unique=True)
    nombre = models.CharField(max_length=150)
    apellido = models.CharField(max_length=150)
    rol = models.CharField(max_length=20, choices=ROLES)
    cliente = models.ForeignKey('partners.Cliente', on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['nombre', 'apellido', 'rol']

    def __str__(self):
        return f'{self.nombre} {self.apellido} ({self.rol})'
