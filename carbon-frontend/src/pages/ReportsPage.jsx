import { useEffect, useState } from 'react';
import api from '../api/axios';
import EmissionCard from '../components/EmissionCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const COLORS = ['#10b981', '#38bdf8', '#a78bfa', '#fb7185'];

export default function ReportsPage() {
  const [report, setReport]   = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([api.get('/reports/owner'), api.get('/reports/monthly')])
      .then(([ownerRes, monthlyRes]) => {
        setReport(ownerRes.data);
        // FIX: monthly data is nested under .monthly key
        setMonthly(monthlyRes.data.monthly || []);
      })
      .catch(() => setError('Failed to load report data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-center mt-20">Loading reports...</div>;
  if (error)   return <div className="text-red-400 text-center mt-20">{error}</div>;

  // FIX: correct field path is report.summary.xxx_co2e_kg
  const summary = report?.summary || {};

  const moduleData = [
    { name: 'Farming',   value: parseFloat(summary.farming_co2e_kg   || 0), color: '#10b981' },
    { name: 'Transport', value: parseFloat(summary.transport_co2e_kg  || 0), color: '#38bdf8' },
    { name: 'Storage',   value: parseFloat(summary.storage_co2e_kg   || 0), color: '#a78bfa' },
    { name: 'Packaging', value: parseFloat(summary.packaging_co2e_kg  || 0), color: '#fb7185' },
  ];

  const totalEmission = parseFloat(summary.total_co2e_kg || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">📈 Reports & Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Comprehensive carbon footprint analysis for Swat Peach Business</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EmissionCard title="Farming"   value={summary.farming_co2e_kg   || 0} icon="🌾" color="emerald" />
        <EmissionCard title="Transport" value={summary.transport_co2e_kg  || 0} icon="🚚" color="sky" />
        <EmissionCard title="Storage"   value={summary.storage_co2e_kg   || 0} icon="🏭" color="violet" />
        <EmissionCard title="Packaging" value={summary.packaging_co2e_kg  || 0} icon="📦" color="rose" />
      </div>

      <div className="bg-gray-900 border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Grand Total Carbon Footprint</p>
          <p className="text-white text-5xl font-bold">
            {totalEmission.toFixed(2)}
            <span className="text-gray-500 text-xl font-normal ml-2">kg CO₂e</span>
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Equivalent to {(totalEmission / 21).toFixed(1)} trees needed to offset annually
          </p>
        </div>
        <div className="text-8xl opacity-20">🌍</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Emissions by Module (kg CO₂e)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={moduleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="value" name="Emission" radius={[6, 6, 0, 0]}>
                {moduleData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Emission Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={moduleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#4b5563' }}>
                {moduleData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {monthly.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Monthly Trend (kg CO₂e)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="emissionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              {/* FIX: use month_name for axis label */}
              <XAxis dataKey="month_name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#fff' }} />
              {/* FIX: field is total_co2e_kg not total_emission */}
              <Area type="monotone" dataKey="total_co2e_kg" stroke="#10b981" strokeWidth={2}
                fill="url(#emissionGrad)" dot={{ fill: '#10b981', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Summary Table</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {['Module', 'Total Emission (kg CO₂e)', 'Share (%)', 'Status'].map(h => (
                <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider pb-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {moduleData.map((d) => {
              const share = totalEmission > 0 ? (d.value / totalEmission) * 100 : 0;
              const isHigh = share > 40;
              return (
                <tr key={d.name} className="hover:bg-gray-800/50">
                  <td className="py-3 text-gray-300 font-medium">{d.name}</td>
                  <td className="py-3 font-semibold" style={{ color: d.color }}>{d.value.toFixed(3)}</td>
                  <td className="py-3 text-gray-300">{share.toFixed(1)}%</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${isHigh ? 'bg-red-900/30 text-red-400' : 'bg-emerald-900/30 text-emerald-400'}`}>
                      {isHigh ? 'High' : 'Normal'}
                    </span>
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-gray-700">
              <td className="py-3 text-white font-bold">TOTAL</td>
              <td className="py-3 text-amber-400 font-bold">{totalEmission.toFixed(3)}</td>
              <td className="py-3 text-white font-bold">100%</td>
              <td className="py-3"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
