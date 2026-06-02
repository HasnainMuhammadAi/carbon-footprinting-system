import { useEffect, useState } from 'react';
import api from '../api/axios';
import EmissionCard from '../components/EmissionCard';
import FaceEnroll from '../components/FaceEnroll';

const defaultForm = {
  farm_id: '', activity_date: '', crop_cycle: '', urea_kg: '', dap_kg: '',
  organic_compost_kg: '', pesticide_type: '', pesticide_litres: '',
  irrigation_kwh: '', machinery_diesel_litres: '', area_treated_ha: '', notes: '',
};

export default function FarmingPanel() {
  const [activities, setActivities] = useState([]);
  const [farms, setFarms]           = useState([]);
  const [form, setForm]             = useState(defaultForm);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [showEnroll, setShowEnroll] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actRes, farmRes] = await Promise.all([api.get('/farming'), api.get('/farms')]);
      setActivities(actRes.data.data || []);
      setFarms(farmRes.data.data || []);
    } catch { setError('Failed to load farming data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
    try {
      await api.post('/farming', form);
      setSuccess('Activity recorded successfully.');
      setForm(defaultForm); fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Failed to add activity.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    try { await api.delete(`/farming/${id}`); fetchData(); }
    catch { setError('Failed to delete activity.'); }
  };

  const totalEmission = activities.reduce((s, a) => s + parseFloat(a.total_co2e_kg || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">🌾 Farming Module</h1>
          <p className="text-gray-500 text-sm mt-1">Record and track farming-related carbon emissions</p>
        </div>
        <button onClick={() => setShowEnroll(!showEnroll)}
          style={{ background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>
          📷 {showEnroll ? 'Hide Face Enroll' : 'Enroll Face Login'}
        </button>
      </div>

      {showEnroll && (
        <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-2">Face Login Enrollment</h3>
          <p className="text-gray-400 text-sm mb-4">Scan your face once to enable face login. You only need to do this one time.</p>
          <FaceEnroll />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <EmissionCard title="Total Farming Emissions" value={totalEmission} icon="🌾" color="emerald" />
        <EmissionCard title="Total Activities" value={activities.length} unit="records" icon="📋" color="amber" />
        <EmissionCard title="Active Farms" value={farms.length} unit="farms" icon="🏡" color="sky" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Add Farming Activity</h2>
        {error   && <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-700/50 rounded-xl text-emerald-400 text-sm">{success}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Farm *</label>
            <select value={form.farm_id} onChange={(e) => setForm({ ...form, farm_id: e.target.value })}
              required className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 text-white rounded-xl px-3 py-2 text-sm outline-none">
              <option value="">Select Farm</option>
              {farms.map((f) => <option key={f.farm_id} value={f.farm_id}>{f.farm_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Activity Date *</label>
            <input type="date" value={form.activity_date} onChange={(e) => setForm({ ...form, activity_date: e.target.value })}
              required className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 text-white rounded-xl px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Crop Cycle * (e.g. 2024-S1)</label>
            <input type="text" value={form.crop_cycle} onChange={(e) => setForm({ ...form, crop_cycle: e.target.value })}
              placeholder="2024-S1" required className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
          </div>
          {[
            { label: 'Urea (kg)', key: 'urea_kg' }, { label: 'DAP (kg)', key: 'dap_kg' },
            { label: 'Organic Compost (kg)', key: 'organic_compost_kg' },
            { label: 'Pesticide (litres)', key: 'pesticide_litres' },
            { label: 'Irrigation (kWh)', key: 'irrigation_kwh' },
            { label: 'Diesel - Machinery (L)', key: 'machinery_diesel_litres' },
            { label: 'Area Treated (ha) *', key: 'area_treated_ha' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-gray-400 text-xs mb-1">{label}</label>
              <input type="number" step="0.001" min="0" value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key === 'area_treated_ha'} placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
            </div>
          ))}
          <div>
            <label className="block text-gray-400 text-xs mb-1">Pesticide Type</label>
            <input type="text" value={form.pesticide_type} onChange={(e) => setForm({ ...form, pesticide_type: e.target.value })}
              placeholder="e.g. Organophosphate"
              className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional notes"
              className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white font-semibold rounded-xl transition-colors text-sm">
              {submitting ? 'Saving...' : '+ Add Activity'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Activity Records</h2>
        {loading ? <p className="text-gray-500 text-sm">Loading...</p> :
         activities.length === 0 ? <p className="text-gray-500 text-sm">No activities recorded yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Farm', 'Date', 'Cycle', 'Urea kg', 'Diesel L', 'Area ha', 'CO₂e kg', ''].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {activities.map((a) => (
                  <tr key={a.activity_id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-300">{a.farm_name || a.farm_id}</td>
                    <td className="py-3 pr-4 text-gray-400">{a.activity_date?.split('T')[0]}</td>
                    <td className="py-3 pr-4 text-gray-300">{a.crop_cycle}</td>
                    <td className="py-3 pr-4 text-gray-300">{a.urea_kg}</td>
                    <td className="py-3 pr-4 text-gray-300">{a.machinery_diesel_litres}</td>
                    <td className="py-3 pr-4 text-gray-300">{a.area_treated_ha}</td>
                    <td className="py-3 pr-4 text-amber-400 font-semibold">{parseFloat(a.total_co2e_kg || 0).toFixed(3)}</td>
                    <td className="py-3">
                      <button onClick={() => handleDelete(a.activity_id)}
                        className="px-2 py-1 bg-red-900/30 hover:bg-red-800/50 text-red-400 rounded-lg text-xs transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
