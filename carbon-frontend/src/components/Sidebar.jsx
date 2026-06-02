import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['owner'] },
  { path: '/farming', label: 'Farming', icon: '🌾', roles: ['owner', 'farming_admin'] },
  { path: '/transport', label: 'Transport', icon: '🚚', roles: ['owner', 'transport_admin'] },
  { path: '/storage', label: 'Storage', icon: '🏭', roles: ['owner', 'storage_admin'] },
  { path: '/packaging', label: 'Packaging', icon: '📦', roles: ['owner', 'packaging_admin'] },
  { path: '/reports', label: 'Reports', icon: '📈', roles: ['owner'] },
];

export default function Sidebar() {
  const { user } = useAuth();

  const navItems = allNavItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-56 bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-3">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-4 py-3 bg-gray-800 rounded-xl border border-gray-700">
        <p className="text-xs text-gray-500 mb-1">Carbon Budget</p>
        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '62%' }}></div>
        </div>
        <p className="text-xs text-emerald-400 font-medium">62% of annual limit</p>
      </div>
    </aside>
  );
}
