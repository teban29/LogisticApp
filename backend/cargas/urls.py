from rest_framework.routers import DefaultRouter
from .views import CargaViewSet, UnidadViewSet, ProductoViewSet

router = DefaultRouter()
router.register(r'cargas', CargaViewSet, basename='carga')
router.register(r'cargas/unidades', UnidadViewSet, basename='unidad')
router.register(r'cargas/productos', ProductoViewSet, basename='producto')  # CRUD básico

urlpatterns = router.urls
