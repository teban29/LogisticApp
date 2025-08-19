from django.db import models

# Create your models here.
class Proveedor(models.Model):
    nombre = models.CharField(max_length=100)
    nit = models.CharField(max_length=50, unique=True)
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(blank=True, null=True, max_length=50)
    ciudad = models.CharField(blank=True, null=True, max_length=50)
    direccion = models.CharField(blank=True, null=True, max_length=50)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['id']
        verbose_name_plural = 'Proveedores'
        
    def __str__(self):
        return self.nombre
    
class Cliente(models.Model):
    nombre = models.CharField(max_length=100)
    nit = models.CharField(max_length=50, unique=True)
    email = models.EmailField(blank=True, null=True)
    telefono = models.CharField(blank=True, null=True, max_length=50)
    ciudad = models.CharField(blank=True, null=True, max_length=50)
    direccion = models.CharField(blank=True, null=True, max_length=50)
    proveedores = models.ManyToManyField(Proveedor, related_name='clientes', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['id']
        verbose_name_plural = 'Clientes'
        
    def __str__(self):
        return self.nombre
    