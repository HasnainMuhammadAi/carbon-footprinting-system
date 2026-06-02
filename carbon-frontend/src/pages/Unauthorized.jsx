import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-white text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">
          Your role <span className="text-amber-400 font-semibold">({user?.role})</span> does not have permission to view this page.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors text-sm"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
