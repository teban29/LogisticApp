from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import Usuario
from .models import Cliente, Proveedor

class PartnersTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            username='admin', nombre='Admin', apellido='X', rol='admin', password='adminpass'
        )
        self.op = Usuario.objects.create_user(
            username='op', nombre='Op', apellido='X', rol='operador', password='oppass'
        )
        login_url = reverse('token_obtain_pair')
        self.admin_token = self.client.post(login_url, {'username': 'admin', 'password': 'adminpass'}, format='json').data['access']
        self.op_token = self.client.post(login_url, {'username': 'op', 'password': 'oppass'}, format='json').data['access']

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_crear_proveedor_como_admin(self):
        self.auth(self.admin_token)  # << IMPORTANTE
        url = reverse('proveedores-list')
        res = self.client.post(url, {
            'nombre': 'Prov A', 'nit': '900123', 'email': 'a@prov.com'
        }, format='json')
        # aserta primero el estado para detectar permisos/validaciones
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, msg=res.data)
        self.assertTrue(Proveedor.objects.filter(nit='900123').exists())

    def test_crear_proveedor_como_operador_falla(self):
        self.auth(self.op_token)
        url = reverse('proveedores-list')
        res = self.client.post(url, {'nombre': 'Prov B', 'nit': '900999'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN, msg=res.data)

    def test_crear_cliente_y_asignar_proveedores(self):
        self.auth(self.admin_token)
        p1 = Proveedor.objects.create(nombre='P1', nit='N1')
        p2 = Proveedor.objects.create(nombre='P2', nit='N2')
        url = reverse('clientes-list')
        res = self.client.post(url, {
            'nombre': 'Cliente A', 'nit': 'C1', 'proveedores': [p1.id, p2.id]
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, msg=res.data)
        c = Cliente.objects.get(nit='C1')
        self.assertEqual(c.proveedores.count(), 2)

    def test_listar_clientes_como_operador_ok(self):
        self.auth(self.op_token)
        url = reverse('clientes-list')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK, msg=res.data)
