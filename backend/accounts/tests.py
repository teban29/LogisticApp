from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Usuario

# Create your tests here.

class UsuarioTest(APITestCase):
    def setUp(self):
        
        # Crear Usuarios
        
        self.admin_user = Usuario.objects.create_user(username='admin', password='admin', nombre='Admin', apellido='Admin', rol='admin',)
        
        self.conductor_user = Usuario.objects.create_user(username='conductor', password='conductor', nombre='Conductor', apellido='Conductor', rol='conductor',)
        
        self.operador_user = Usuario.objects.create_user(username='operador', password='operador', nombre='Operador', apellido='Operador', rol='operador',)
        
        # Obtener token de admin
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'username':'admin', 'password':'admin'}, format='json')
        self.admin_token = response.data['access']
        
    def test_login_usuario(self):
        """Debe permitir login y devolver token"""
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'username':'admin', 'password':'admin'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        
    def crear_usuario_por_admin(self):
        """El admin puede crear usuarios"""
        url = reverse('usuarios-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        data = {
            'username': 'test',
            'nombre': 'Test',
            'apellido': 'Test',
            'rol': 'operador',
            'password': 'test'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Usuario.objects.filter(username='test').exists())
        
    def crear_usuario_sin_admin(self):
        """No puede crear usuarios sin rol admin"""
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'username':'operador', 'password':'operador'}, format='json')
        operador_token = response.data['access']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {operador_token}')
        data = {
            'username': 'prohibited',
            'nombre': 'Prohibited',
            'apellido': 'Prohibited',
            'rol': 'operador',
            'password': 'prohibited'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_listar_usuarios(self):
        """El admin puede listar usuarios"""
        url = reverse('usuarios-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)  # Paginado