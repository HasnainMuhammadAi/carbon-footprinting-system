import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import FaceLogin from '../components/FaceLogin';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showFace, setShowFace] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const roleRedirect = {
    owner:           '/dashboard',
    farming_admin:   '/farming',
    transport_admin: '/transport',
    storage_admin:   '/storage',
    packaging_admin: '/packaging',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const { token, user } = res.data;
      login(user, token);
      navigate(roleRedirect[user.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceSuccess = (data) => {
    login(data.user, data.token);
    navigate(roleRedirect[data.user.role] || '/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-4">
            <span className="text-3xl">🍑</span>
          </div>
          <h1 className="text-white text-2xl font-bold">SwatCarbon</h1>
          <p className="text-gray-500 text-sm mt-1">Peach Business Carbon Management · Swat, Pakistan</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-white text-xl font-semibold mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Toggle between password and face login */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShowFace(false)}
              style={{
                flex: 1, padding: '8px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: !showFace ? '#16a34a' : 'transparent',
                color: !showFace ? '#fff' : '#9ca3af',
                border: !showFace ? 'none' : '1px solid #374151',
                cursor: 'pointer',
              }}
            >
              🔑 Password
            </button>
            <button
              onClick={() => setShowFace(true)}
              style={{
                flex: 1, padding: '8px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: showFace ? '#16a34a' : 'transparent',
                color: showFace ? '#fff' : '#9ca3af',
                border: showFace ? 'none' : '1px solid #374151',
                cursor: 'pointer',
              }}
            >
              📷 Face Login
            </button>
          </div>

          {/* Password Login */}
          {!showFace && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors placeholder-gray-600"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Face Login */}
          {showFace && (
            <FaceLogin onSuccess={handleFaceSuccess} />
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Role-Based Carbon Footprint Management System v1.0
        </p>
      </div>
    </div>
  );
}
