from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from partners.models import Cliente, Proveedor
from cargas.models import Carga, CargaItem, Producto, Unidad
from envios.models import Envio, EnvioItem

User = get_user_model()

class SetupTestDataMixin:
    """Mixin para configurar datos de prueba comunes"""
    
    def setUp(self):
        # Usuario administrador
        self.admin_user = User.objects.create_user(
            username="admin_test",
            password="testpass123",
            nombre="Admin",
            apellido="Test",
            rol="admin"
        )
        
        # Clientes
        self.cliente1 = Cliente.objects.create(nombre="Cliente Uno", nit="111111111")
        self.cliente2 = Cliente.objects.create(nombre="Cliente Dos", nit="222222222")
        
        # Proveedor
        self.proveedor = Proveedor.objects.create(nombre="Proveedor Test", nit="999999999")
        
        # Producto
        self.producto = Producto.objects.create(sku="PROD001", nombre="Producto Test")
        
        # Carga y unidades
        self.carga = Carga.objects.create(
            cliente=self.cliente1,
            proveedor=self.proveedor,
            remision="REM001"
        )
        
        self.carga_item = CargaItem.objects.create(
            carga=self.carga,
            producto=self.producto,
            cantidad=3
        )
        
        self.unidad1 = Unidad.objects.create(
            carga_item=self.carga_item,
            codigo_barra="CL1CG1001ABC1234561",
            estado="disponible"
        )
        
        self.unidad2 = Unidad.objects.create(
            carga_item=self.carga_item,
            codigo_barra="CL1CG1002DEF7890122",
            estado="disponible"
        )
        
        # Cliente de API
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin_user)


class EnvioModelTest(TestCase):
    def test_crear_envio_y_actualizar_valor_total(self):
        """Test básico de creación de envío y cálculo de valor total"""
        cliente = Cliente.objects.create(nombre="Test Cliente", nit="123456789")
        
        envio = Envio.objects.create(
            cliente=cliente,
            conductor="Test Driver",
            placa_vehiculo="TEST001",
            origen="Test Origin"
        )
        
        self.assertEqual(envio.estado, "borrador")
        self.assertEqual(envio.valor_total, 0)
        self.assertTrue(envio.numero_guia.startswith("TES"))


class EnvioAPITest(SetupTestDataMixin, APITestCase):
    
    def test_crear_envio_con_items(self):
        """Test crear envío con items y verificar valor total"""
        url = reverse('envio-list')
        data = {
            'cliente': self.cliente1.id,
            'conductor': 'Test Driver',
            'placa_vehiculo': 'TEST001',
            'origen': 'Test Origin',
            'items_data': [
                {'unidad_id': self.unidad1.id, 'valor_unitario': '150.75'},
                {'unidad_id': self.unidad2.id, 'valor_unitario': '89.50'}
            ]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['valor_total'], '240.25')
        self.assertEqual(response.data['estado'], 'pendiente')
        
        # Verificar estados de unidades
        self.unidad1.refresh_from_db()
        self.unidad2.refresh_from_db()
        self.assertEqual(self.unidad1.estado, 'reservada')
        self.assertEqual(self.unidad2.estado, 'reservada')

    def test_agregar_item_por_codigo_barras(self):
        """Test agregar item individual mediante código de barras"""
        envio = Envio.objects.create(
            cliente=self.cliente1,
            conductor="Test Driver",
            placa_vehiculo="TEST001",
            origen="Test Origin"
        )
        
        url = reverse('envio-agregar-item', kwargs={'pk': envio.id})
        data = {'codigo_barra': self.unidad1.codigo_barra, 'valor_unitario': '199.99'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        envio.refresh_from_db()
        self.assertEqual(float(envio.valor_total), 199.99)
        self.assertEqual(envio.estado, 'pendiente')

    def test_remover_item(self):
        """Test remover item y verificar que se libera la unidad"""
        envio = Envio.objects.create(
            cliente=self.cliente1,
            conductor="Test Driver",
            placa_vehiculo="TEST001",
            origen="Test Origin",
            estado="pendiente"
        )
        
        # Crear item manualmente
        envio_item = EnvioItem.objects.create(
            envio=envio,
            unidad=self.unidad1,
            valor_unitario=150.00
        )
        self.unidad1.estado = 'reservada'
        self.unidad1.save()
        
        url = reverse('envio-remover-item', kwargs={'pk': envio.id})
        response = self.client.delete(url, {'item_id': envio_item.id}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(envio.items.count(), 0)
        
        # Verificar que la unidad se liberó
        self.unidad1.refresh_from_db()
        self.assertEqual(self.unidad1.estado, 'disponible')

    def test_obtener_cargas_por_cliente(self):
        """Test obtener cargas disponibles para un cliente"""
        url = reverse('envio-cargas-por-cliente')
        response = self.client.get(url, {'cliente_id': self.cliente1.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)

    def test_validacion_unidad_cliente_incorrecto(self):
        """Test que valida que no se puede agregar unidad de otro cliente"""
        # Crear unidad de otro cliente
        carga_cliente2 = Carga.objects.create(cliente=self.cliente2, proveedor=self.proveedor, remision="REM002")
        carga_item = CargaItem.objects.create(carga=carga_cliente2, producto=self.producto, cantidad=1)
        unidad_otro_cliente = Unidad.objects.create(
            carga_item=carga_item,
            codigo_barra="CL2CG2001XYZ9999993",
            estado="disponible"
        )
        
        url = reverse('envio-list')
        data = {
            'cliente': self.cliente1.id,
            'conductor': 'Test Driver',
            'placa_vehiculo': 'TEST001',
            'origen': 'Test Origin',
            'items_data': [{'unidad_id': unidad_otro_cliente.id, 'valor_unitario': '100.00'}]
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EnvioEdgeCasesTest(SetupTestDataMixin, APITestCase):
    
    def test_agregar_unidad_no_disponible(self):
        """Test intentar agregar unidad no disponible"""
        self.unidad1.estado = 'despachada'
        self.unidad1.save()
        
        envio = Envio.objects.create(
            cliente=self.cliente1,
            conductor="Test Driver",
            placa_vehiculo="TEST001",
            origen="Test Origin"
        )
        
        url = reverse('envio-agregar-item', kwargs={'pk': envio.id})
        data = {'codigo_barra': self.unidad1.codigo_barra, 'valor_unitario': '100.00'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_agregar_unidad_inexistente(self):
        """Test intentar agregar unidad con código inexistente"""
        envio = Envio.objects.create(
            cliente=self.cliente1,
            conductor="Test Driver",
            placa_vehiculo="TEST001",
            origen="Test Origin"
        )
        
        url = reverse('envio-agregar-item', kwargs={'pk': envio.id})
        data = {'codigo_barra': 'CODIGO_INEXISTENTE', 'valor_unitario': '100.00'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EnvioPermissionsTest(APITestCase):
    
    def test_solo_admin_puede_acceder(self):
        """Test que verifica que solo administradores pueden acceder"""
        # Usuario operador
        operador = User.objects.create_user(
            username="operador_test",
            password="testpass",
            nombre="Operador",
            apellido="Test",
            rol="operador"
        )
        
        self.client.force_authenticate(user=operador)
        url = reverse('envio-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)