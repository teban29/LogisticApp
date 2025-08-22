from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminRole(BasePermission):
    """
    Permite acceso solo a los usuarios con el rol 'admin'
    Se puede ampliar a otros roles
    """
    
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return user.rol == 'admin'
        
        return user.rol == 'admin'
    