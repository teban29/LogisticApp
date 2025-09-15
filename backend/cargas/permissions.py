from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminRole(BasePermission):
    """
    Permite acceso solo a los usuarios con el rol 'admin'
    """
    
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.rol == 'admin'

class IsAdminOrOperador(BasePermission):
    """
    Permite a admin y operador acceder
    """
    
    def has_permission(self, request, view):
        user = request.user
        print(f"CHECK PERMISO - User: {user}, Rol: {getattr(user, 'rol', None)}, Autenticado: {user.is_authenticated}")
        
        if not user or not user.is_authenticated:
            return False
        
        return user.rol in ['admin', 'operador']

class IsAdminOrOperadorForCargas(BasePermission):
    """
    Permite a admin y operador crear y leer cargas
    Solo admin puede editar y eliminar
    """
    
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        user_role = getattr(user, 'rol', None)
        
        # Admin puede hacer todo
        if user_role == 'admin':
            return True
        
        # Operador puede leer (GET) y crear (POST) y acciones GET personalizadas
        if user_role == 'operador':
            # Permitir todas las acciones GET (list, retrieve, acciones personalizadas)
            if request.method in ['GET']:
                return True
            # Permitir crear cargas (POST) solo para la acción create
            if request.method in ['POST'] and getattr(view, 'action', None) == 'create':
                return True
            
        return False

class PuedeVerCarga(BasePermission):
    """
    Permite ver cargas según el rol:
    - Admin: todas las cargas
    - Operador: todas las cargas
    - Cliente: solo sus cargas asignadas
    """
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.rol in ['admin', 'operador']:
            return True
            
        if user.rol == 'cliente':
            # Verificar si la carga pertenece al cliente del usuario
            return obj.cliente == user.cliente
            
        return False

class PuedeImprimirEtiquetas(BasePermission):
    """
    Permite imprimir etiquetas según el rol:
    - Admin: todas las cargas
    - Operador: todas las cargas  
    - Cliente: solo sus cargas
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.rol in ['admin', 'operador']
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if user.rol in ['admin', 'operador']:
            return True
            
        return False