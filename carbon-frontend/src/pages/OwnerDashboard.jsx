import { useEffect, useState } from 'react';
import api from '../api/axios';
import EmissionCard from '../components/EmissionCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import FaceEnroll from '../components/FaceEnroll';

const COLORS = ['#10b981', '#f59e0b', '#38bdf8', '#a78bfa', '#fb7185'];

export default function OwnerDashboard() {
  const [report, setReport]   = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [showEnroll, setShowEnroll] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/reports/owner'),
      api.get('/reports/monthly'),
    ])
      .then(([ownerRes, monthlyRes]) => {
        setReport(ownerRes.data);
        setMonthly(monthlyRes.data.monthly || []);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-center mt-20">Loading dashboard...</div>;
  if (error)   return <div className="text-red-400 text-center mt-20">{error}</div>;

  const summary      = report?.summary || {};
  const totalEmission = parseFloat(summary.total_co2e_kg || 0);

  const moduleData = [
    { name: 'Farming',   value: parseFloat(summary.farming_co2e_kg   || 0) },
    { name: 'Transport', value: parseFloat(summary.transport_co2e_kg  || 0) },
    { name: 'Storage',   value: parseFloat(summary.storage_co2e_kg   || 0) },
    { name: 'Packaging', value: parseFloat(summary.packaging_co2e_kg  || 0) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Owner Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Full overview — SwatCarbon Peach Business</p>
        </div>
        {/* Face Enroll Button */}
        <button
          onClick={() => setShowEnroll(!showEnroll)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          📷 {showEnroll ? 'Hide Face Enroll' : 'Enroll Face Login'}
        </button>
      </div>

      {/* Face Enroll Panel */}
      {showEnroll && (
        <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Face Login Enrollment</h3>
          <p className="text-gray-400 text-sm mb-4">
            Scan your face once to enable face login. You only need to do this one time.
          </p>
          <FaceEnroll />
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EmissionCard title="Farming"   value={summary.farming_co2e_kg   || 0} icon="🌾" color="emerald" trend={-4} />
        <EmissionCard title="Transport" value={summary.transport_co2e_kg  || 0} icon="🚚" color="sky"     trend={2}  />
        <EmissionCard title="Storage"   value={summary.storage_co2e_kg   || 0} icon="🏭" color="violet"  trend={-1} />
        <EmissionCard title="Packaging" value={summary.packaging_co2e_kg  || 0} icon="📦" color="rose"    trend={5}  />
      </div>

      {/* Total Banner */}
      <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest">Total Carbon Footprint</p>
          <p className="text-amber-400 text-4xl font-bold mt-1">
            {totalEmission.toFixed(2)}
            <span className="text-gray-500 text-lg font-normal ml-2">kg CO₂e</span>
          </p>
        </div>
        <span className="text-6xl opacity-30">🌍</span>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Emissions by Module</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={moduleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {moduleData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Emission Share</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={moduleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {moduleData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Line Chart */}
      {monthly.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Monthly Emission Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month_name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
              <Line type="monotone" dataKey="total_co2e_kg" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
