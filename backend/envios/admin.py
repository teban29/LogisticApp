from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Envio, EnvioItem

@admin.register(Envio)
class EnvioAdmin(admin.ModelAdmin):
    list_display = ['numero_guia', 'cliente', 'conductor', 'valor_total', 'estado', 'created_at']
    list_filter = ['estado', 'cliente', 'created_at']
    search_fields = ['numero_guia', 'cliente__nombre', 'conductor']
    readonly_fields = ['numero_guia', 'created_at', 'updated_at']

@admin.register(EnvioItem)
class EnvioItemAdmin(admin.ModelAdmin):
    list_display = ['envio', 'unidad', 'valor_unitario', 'created_at']
    list_filter = ['created_at']
    search_fields = ['unidad__codigo_barra', 'envio__numero_guia']