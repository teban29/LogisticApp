import os
import random
import time
import uuid

_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

def _base32_encode(num: int, length: int = 26) -> str:
    chars = []
    for _ in range(length):
        num, rem = divmod(num, 32)
        chars.append(_ALPHABET[rem])
    return ''.join(reversed(chars))

def _entropy () -> int:
    ts = int(time.time() * 1000) & ((1 << 48) - 1)
    rnd = random.getrandbits(32)
    return (ts << 32) | rnd

def _luhn_mod10(num_str: str) -> str:
    total = 0
    reversed_digits = list(map(int, [c for c in num_str if c.isdigit()]))
    reversed_digits.reverse()
    for i, d in enumerate(reversed_digits):
        if i % 2 == 0:
            total += d
        
        else:
            d2 = d * 2
            total += d2 - 9 if d2 > 9 else d2
            
    return str((10 - (total % 10)) % 10)

def generate_barcode(cliente_id: int, carga_id: int, unidad_seq: int) -> str:
    """
    Genera un codigo de barras unico
    CL<cliente>-CG<carga>-<base32>-<DV>
    Ej: CL5-CG12-01C9T...-7
    """
    
    rnd = _base32_encode(_entropy(), 13)
    prefix = f'CL{cliente_id}CG{carga_id}'
    digits = f'{cliente_id}{carga_id}{unidad_seq}{abs(hash(rnd))}'
    dv = _luhn_mod10(digits)
    return f'{prefix}{rnd}{dv}'