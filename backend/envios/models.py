from django.db import models
from django.core.validators import MinValueValidator
from partners.models import Cliente
from cargas.models import Unidad
import random
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

class Envio(models.Model):
    ESTADOS_ENVIO = (
        ('borrador', 'Borrador'),
        ('pendiente', 'Pendiente'),
        ('en_transito', 'En Tránsito'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    )
    
    numero_guia = models.CharField(max_length=20, unique=True, db_index=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='envios')
    conductor = models.CharField(max_length=100)
    placa_vehiculo = models.CharField(max_length=20)
    origen = models.CharField(max_length=200)
    valor_total = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )
    estado = models.CharField(max_length=20, choices=ESTADOS_ENVIO, default='borrador')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Envios'
        
    def __str__(self):
        return f"{self.numero_guia} - {self.cliente.nombre}"
    
    def save(self, *args, **kwargs):
        if not self.numero_guia:
            self.numero_guia = self.generar_numero_guia()
        super().save(*args, **kwargs)
    
    def generar_numero_guia(self):
        """Genera número de guía con 3 iniciales del cliente + 6 dígitos random"""
        iniciales = self.cliente.nombre[:3].upper().replace(' ', 'X')
        while len(iniciales) < 3:
            iniciales += 'X'
        
        while True:
            numero = str(random.randint(100000, 999999))
            numero_guia = f"{iniciales}{numero}"
            if not Envio.objects.filter(numero_guia=numero_guia).exists():
                return numero_guia
    
    def actualizar_valor_total(self):
        """Actualiza el valor total sumando todos los items"""
        total = sum(item.valor_unitario for item in self.items.all())
        self.valor_total = total
        self.save(update_fields=['valor_total'])


class EnvioItem(models.Model):
    envio = models.ForeignKey(Envio, on_delete=models.CASCADE, related_name='items')
    unidad = models.ForeignKey(Unidad, on_delete=models.PROTECT, related_name='envio_items')
    valor_unitario = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['id']
        unique_together = ['envio', 'unidad']
        
    def __str__(self):
        return f"{self.unidad.codigo_barra} - ${self.valor_unitario}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.envio.actualizar_valor_total()
    
    def delete(self, *args, **kwargs):
        envio = self.envio
        super().delete(*args, **kwargs)
        envio.actualizar_valor_total()
        
@receiver(post_save, sender=EnvioItem)
def actualizar_valor_total_despues_guardar(sender, instance, **kwargs):
    """Actualiza el valor total después de guardar un item"""
    if kwargs.get('created', False) or 'valor_unitario' in instance.get_dirty_fields():
        instance.envio.actualizar_valor_total()

@receiver(post_delete, sender=EnvioItem)
def actualizar_valor_total_despues_eliminar(sender, instance, **kwargs):
    """Actualiza el valor total después de eliminar un item"""
    instance.envio.actualizar_valor_total()

# Método auxiliar para detectar campos modificados
def get_dirty_fields(self):
    """
    Retorna un diccionario con los campos que han cambiado desde la última vez
    que se guardó el objeto.
    """
    if not self.pk:
        return {}
    
    old = type(self).objects.get(pk=self.pk)
    dirty = {}
    for field in self._meta.fields:
        if getattr(self, field.name) != getattr(old, field.name):
            dirty[field.name] = getattr(old, field.name)
    return dirty