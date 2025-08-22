from django.db import models
from django.utils import timezone
from django.core.validators import FileExtensionValidator
from django.conf import settings

from partners.models import Cliente, Proveedor

# Create your models here.

class Producto(models.Model):
    sku = models.CharField(max_length=64, unique=True)
    nombre = models.CharField(max_length=128)
    unidad = models.CharField(max_length=32, default='unidad')
    peso_kg = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']
        verbose_name_plural = 'productos'
        
    def __str__(self):
        return f"{self.sku}-{self.nombre}"
    

class Carga(models.Model):
    ESTADOS = (
        ('recibida', 'Recibida'),
        ('etiquetada', 'Etiquetada'),
        ('almacenada', 'Almacenada'),
    )
    
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='cargas')
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name='cargas')
    remision = models.CharField(max_length=100)
    factura = models.FileField(
        upload_to='cargas/facturas',
        validators=[FileExtensionValidator(allowed_extensions=['pdf','png','jpg','jpeg'])],
        blank=True,
        null=True,
        help_text='PDF o imagen (png/jpg)'
    )
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='recibida')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Cargas'
        
    def __str__(self):
        return f"CG{self.id} = {self.cliente.nombre} {self.remision}"
    
    
class CargaItem(models.Model):
    carga = models.ForeignKey(Carga, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, related_name='carga_items')
    cantidad = models.PositiveIntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['id']
        
    def __str__(self):
        return f'Item #{self.id} Carga {self.carga.id} {self.producto.sku} x {self.cantidad}'


class Unidad(models.Model):
    ESTADOS = (
        ('disponible', 'Disponible'),
        ('reservada', 'Reservada'),
        ('despachada', 'Despachada'),
        ('bloqueada', 'Bloqueada'),
    )

    carga_item = models.ForeignKey(CargaItem, on_delete=models.CASCADE, related_name='unidades')
    codigo_barra = models.CharField(max_length=64, unique=True, db_index=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='disponible')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.codigo_barra} ({self.estado})'