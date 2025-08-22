from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from accounts.models import Usuario
from partners.models import Cliente, Proveedor
from .models import Producto, Unidad


class CargasAPITests(TestCase):
    def setUp(self):
        # Usuario admin (con campos obligatorios)
        self.admin = Usuario.objects.create_user(
            username='admin1',
            password='pass123',
            rol='admin',
            nombre='Admin',
            apellido='User'
        )

        # API client autenticado forzadamente (compatible con JWT-only)
        self.client_api = APIClient()
        self.client_api.force_authenticate(user=self.admin)

        # Datos base
        self.cliente = Cliente.objects.create(nombre='Cliente A', nit='C-001')
        self.proveedor = Proveedor.objects.create(nombre='Prov X', nit='P-001')
        self.prod1 = Producto.objects.create(sku='SKU1', nombre='Tambor', unidad='tambor')
        self.prod2 = Producto.objects.create(sku='SKU2', nombre='Caja', unidad='caja')

    def test_crear_carga_con_items_y_factura(self):
        url = '/api/cargas/'
        
        # Primero crea la carga sin la factura (usando JSON)
        payload = {
            'cliente': self.cliente.id,
            'proveedor': self.proveedor.id,
            'remision': 'REM-123',
            'observaciones': 'Observación de prueba',
            'auto_generar_unidades': True,
            'items_data': [
                {'producto_id': self.prod1.id, 'cantidad': 4},
                {'producto_id': self.prod2.id, 'cantidad': 2},
            ],
        }
        resp = self.client_api.post(url, data=payload, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)

        carga_id = resp.data['id']

        # Luego sube la factura por separado (usando multipart)
        factura = SimpleUploadedFile('factura.pdf', b'%PDF-1.4 test', content_type='application/pdf')
        patch_url = f'/api/cargas/{carga_id}/'
        resp2 = self.client_api.patch(patch_url, data={'factura': factura}, format='multipart')
        self.assertEqual(resp2.status_code, 200, resp2.content)
        self.assertTrue(resp2.data.get('factura'))

        # Verificar unidades generadas automáticamente
        resp3 = self.client_api.get(f'/api/cargas/{carga_id}/')
        self.assertEqual(resp3.status_code, 200, resp3.content)
        items = resp3.data['items']
        unidades_total = sum(it.get('unidades_count', 0) for it in items)
        self.assertEqual(unidades_total, 6)

        # Un código de barra debe ser único
        first_unidad = Unidad.objects.first()
        self.assertIsNotNone(first_unidad)
        self.assertTrue(first_unidad.codigo_barra)
        self.assertEqual(Unidad.objects.filter(codigo_barra=first_unidad.codigo_barra).count(), 1)

    def test_action_generar_unidades(self):
        # crear carga sin auto-generación
        resp = self.client_api.post('/api/cargas/', data={
            'cliente': self.cliente.id,
            'proveedor': self.proveedor.id,
            'remision': 'REM-999',
            'auto_generar_unidades': False,
            'items_data': [{'producto_id': self.prod1.id, 'cantidad': 3}],
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        carga_id = resp.data['id']

        # antes de generar
        self.assertEqual(Unidad.objects.count(), 0)

        # acción
        resp2 = self.client_api.post(f'/api/cargas/{carga_id}/generar_unidades/')
        self.assertEqual(resp2.status_code, 200, resp2.content)
        self.assertEqual(Unidad.objects.count(), 3)

    def test_permiso_solo_admin(self):
        # usuario no admin (con campos obligatorios)
        other = Usuario.objects.create_user(
            username='user1',
            password='pass123',
            rol='operador',
            nombre='Oper',
            apellido='User'
        )
        client2 = APIClient()
        client2.force_authenticate(user=other)  # autenticado pero no admin
        resp = client2.get('/api/cargas/')
        self.assertEqual(resp.status_code, 403)
        
    