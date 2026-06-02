import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    owner: 'text-amber-400',
    farming_admin: 'text-emerald-400',
    transport_admin: 'text-sky-400',
    storage_admin: 'text-violet-400',
    packaging_admin: 'text-rose-400',
  };

  const roleLabel = {
    owner: 'Owner',
    farming_admin: 'Farming Admin',
    transport_admin: 'Transport Admin',
    storage_admin: 'Storage Admin',
    packaging_admin: 'Packaging Admin',
  };

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">🍑</span>
        </div>
        <div>
          <span className="text-white font-semibold text-sm tracking-wide">SwatCarbon</span>
          <span className="text-gray-500 text-xs ml-2">Peach Footprint System</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-white text-sm font-medium">{user?.username}</p>
          <p className={`text-xs font-semibold uppercase tracking-widest ${roleColors[user?.role] || 'text-gray-400'}`}>
            {roleLabel[user?.role] || user?.role}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-gray-800 hover:bg-red-900 border border-gray-700 hover:border-red-700 text-gray-300 hover:text-red-300 rounded-lg text-sm transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
