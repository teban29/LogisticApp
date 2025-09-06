from rest_framework.routers import DefaultRouter
from .views import EnvioViewSet, EnvioItemViewSet

router = DefaultRouter()
router.register(r'envios', EnvioViewSet, basename='envio')
router.register(r'envios-items', EnvioItemViewSet, basename='envio-item')

urlpatterns = router.urls
