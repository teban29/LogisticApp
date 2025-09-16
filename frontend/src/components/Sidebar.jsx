import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
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
  RiArrowLeftSLine,
} from 'react-icons/ri';

const navItemBase =
  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200';
const navItemActive = 'bg-blue-50 text-blue-700 font-medium border-r-4 border-blue-600';
const navItemInactive = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';

export default function Sidebar({ open, setOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const items = [
    { to: '/', label: 'Dashboard', icon: <RiDashboardLine />, allowedRoles: ['admin', 'operador', 'conductor', 'cliente'] },
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
      to: '/cargas',
      label: 'Cargas',
      icon: <RiArchive2Line />,
      allowedRoles: ['admin', 'operador', 'cliente'],
    },
    {
      to: '/envios',
      label: 'Envíos',
      icon: <RiTruckLine />,
      allowedRoles: ['admin', 'operador', 'cliente', 'conductor'],
    },
    {
      to: '/usuarios',
      label: 'Usuarios',
      icon: <RiUser3Line />,
      allowedRoles: ['admin'], // solo admins
    },
  ];

  const canShow = (item) => {
    if (!user) return false;
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
    return item.allowedRoles.includes(user.rol);
  };

  return (
    <>
      {/* Overlay para móviles */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      <aside
        className={`
          fixed z-30 inset-y-0 left-0 w-72 bg-white border-r border-gray-200 p-5 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          shadow-xl lg:shadow-none
        `}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center justify-center w-full">
            <img 
              src={logo} 
              alt="Logo" 
              className="w-50 h-25 object-cover"
            />
          </div>

          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menú"
          >
            <RiCloseLine className="text-lg" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="space-y-1.5 flex-1">
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
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span className="flex-grow">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Pie de página */}
        <div className="pt-4 mt-auto border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors group"
          >
            <RiLogoutCircleRLine className="text-lg transition-transform group-hover:scale-110" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}