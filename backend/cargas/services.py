from django.db import transaction
from .models import Carga, Unidad
from .utils import generate_barcode

@transaction.atomic
def generar_unidades_para_carga(carga: Carga):
    """
    Crea una Unidad por cada cantiidad de cada CargaItem
    Genera codigos de barras unicos
    """
    
    cliente_id = carga.cliente.id
    seq = 0
    unidades_bulk = []
    
    for item in carga.items.select_related('carga').all():
        existentes = item.unidades.count()
        if existentes >= item.cantidad:
            continue
        
        unidades_a_crear = item.cantidad - existentes
        for _ in range(unidades_a_crear):
            seq += 1
            codigo = generate_barcode(cliente_id, carga.id, seq)
            unidades_bulk.append(Unidad(carga_item=item, codigo_barra=codigo))
            
    if unidades_bulk:
        Unidad.objects.bulk_create(unidades_bulk)
        
    if carga.items.filter(unidades__isnull=False).exists():
        carga.estado = 'etiquetada'
        carga.save(update_fields=['estado'])
        
            