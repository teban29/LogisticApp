
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('api/admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/partners/', include('partners.urls')),
    path('api/', include('cargas.urls')),
    path('api/', include('envios.urls')),
    path('api/', include('dashboard.urls')),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)