from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    """
    Permite acceso solo a usuarios con rol 'admin'
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol == 'admin'
    
class EsClienteYTieneCliente(BasePermission):
    """Permiso para usuarios cliente que tienen cliente asignado"""
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
                request.user.rol == 'cliente' and 
                request.user.cliente is not None)

class SoloSuCliente(BasePermission):
    """Permiso para que usuarios cliente solo accedan a sus datos"""
    def has_object_permission(self, request, view, obj):
        # Para objetos que tienen relación directa con Cliente
        if hasattr(obj, 'cliente'):
            return obj.cliente == request.user.cliente
        return False