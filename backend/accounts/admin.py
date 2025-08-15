from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario

class UsuarioAdmin(UserAdmin):
    model = Usuario
    list_display = ('username', 'nombre', 'apellido', 'rol', 'is_active')
    list_filter = ('rol', 'is_active')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información personal', {'fields': ('nombre', 'apellido', 'rol')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'nombre', 'apellido', 'rol', 'password1', 'password2'),
        }),
    )
    search_fields = ('username', 'nombre', 'apellido')
    ordering = ('username',)

admin.site.register(Usuario, UsuarioAdmin)
