from django.contrib import admin
from .models import Carga, Producto, Unidad, CargaItem

# Register your models here.

admin.site.register(Producto)
admin.site.register(Carga)
admin.site.register(CargaItem)
admin.site.register(Unidad)
