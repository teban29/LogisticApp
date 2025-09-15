from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    """
    Permite acceso solo a usuarios con rol de administrador.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.rol == 'admin'
    
class IsAdminOrOperadorForEnvios(BasePermission):
    """
    Permite a admin y operador ver envíos
    Solo admin puede modificar/eliminar
    """
    
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        if user.rol == 'admin':
            return True
            
        if user.rol == 'operador':
            # Operador solo puede ver (GET) envíos
            if request.method in ['GET']:
                return True
            # También puede hacer acciones personalizadas GET
            if hasattr(view, 'action') and view.action in ['list', 'retrieve']:
                return True
                
        return False

class PuedeVerEnvio(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        
        # Admin, operador y conductor siempre pueden ver
        if user.rol in ['admin', 'operador', 'conductor']:
            return True
        
        # Cliente puede ver sus envíos
        if user.rol == 'cliente' and user.cliente:
            return True

        return False

class IsAdminOrConductor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.rol == "admin" or request.user.rol == "conductor"
        )