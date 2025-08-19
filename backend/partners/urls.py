from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, ProveedorViewSet

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='clientes')
router.register(r'proveedores', ProveedorViewSet, basename='proveedores')

urlpatterns = [
    path('', include(router.urls)),
]
