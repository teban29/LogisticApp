import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  RiDashboardLine,
  RiTeamLine,
  RiUser3Line,
  RiBuilding2Line,
  RiArchive2Line,
  RiTruckLine,
  RiSettings3Line,
  RiLogoutCircleRLine,
  RiCloseLine,
} from 'react-icons/ri';

const navItemBase =
  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors';
const navItemActive = 'bg-gray-900 text-white';
const navItemInactive = 'text-gray-700 hover:bg-gray-100';

export default function Sidebar({ open, setOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // items: agrega allowedRoles: [] si solo algunos roles deben verlo.
  // Si allowedRoles está vacío o no existe, cualquier usuario autenticado lo verá.
  const items = [
    { to: '/', label: 'Dashboard', icon: <RiDashboardLine /> }, // visible para todos
    {
      to: '/usuarios',
      label: 'Usuarios',
      icon: <RiUser3Line />,
      allowedRoles: ['admin'], // solo admins
    },
    {
      to: '/clientes',
      label: 'Clientes',
      icon: <RiTeamLine />,
      allowedRoles: ['admin', 'operador'],
    },
    {
      to: '/proveedores',
      label: 'Proveedores',
      icon: <RiBuilding2Line />,
      allowedRoles: ['admin', 'operador'],
    },
    {
      to: '/inventario',
      label: 'Inventario',
      icon: <RiArchive2Line />,
      allowedRoles: ['admin', 'operador'],
    },
    {
      to: '/envios',
      label: 'Envíos',
      icon: <RiTruckLine />,
      allowedRoles: ['admin', 'operador', 'cliente'],
    },
    {
      to: '/configuracion',
      label: 'Configuración',
      icon: <RiSettings3Line />,
      allowedRoles: ['admin'],
    },
  ];

  const canShow = (item) => {
    if (!user) return false;
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
    return item.allowedRoles.includes(user.rol);
  };

  return (
    <aside
      className={`
        fixed z-30 inset-y-0 left-0 w-72 bg-white border-r p-4 flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl border flex items-center justify-center">🚚</div>
          <div>
            <div className="font-semibold">LogísticApp</div>
            {user && (
              <div className="text-xs text-gray-500">
                {user.nombre} {user.apellido} • {user.rol}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="lg:hidden p-2 border rounded-xl"
          aria-label="Cerrar menú"
        >
          <RiCloseLine />
        </button>
      </div>

      <nav className="space-y-1 flex-1">
        {items.filter(canShow).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pt-3 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50"
        >
          <RiLogoutCircleRLine className="text-lg" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
