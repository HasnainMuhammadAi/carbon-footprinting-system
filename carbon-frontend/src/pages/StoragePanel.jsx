import { useEffect, useState } from 'react';
import api from '../api/axios';
import EmissionCard from '../components/EmissionCard';
import FaceEnroll from '../components/FaceEnroll';

const defaultForm = {
  facility_name: '', farm_id: '', start_date: '', end_date: '',
  electricity_kwh: '', grid_region: 'pesco', refrigerant_type: 'R-134a',
  refrigerant_leaked_kg: '', capacity_tonnes: '', product_stored_tonnes: '', notes: '',
};
const gridRegions      = ['pepco', 'pesco', 'hesco', 'qesco', 'iesco'];
const refrigerantTypes = ['R-22', 'R-134a', 'R-404A', 'R-290', 'R-717', 'none'];

export default function StoragePanel() {
  const [records, setRecords]       = useState([]);
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
      const [stRes, farmRes] = await Promise.all([api.get('/storage'), api.get('/farms')]);
      setRecords(stRes.data.data || []); setFarms(farmRes.data.data || []);
    } catch { setError('Failed to load storage data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
    try {
      await api.post('/storage', form);
      setSuccess('Storage usage recorded.'); setForm(defaultForm); fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Failed to add record.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/storage/${id}`); fetchData(); }
    catch { setError('Failed to delete.'); }
  };

  const totalEmission = records.reduce((s, r) => s + parseFloat(r.total_co2e_kg || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">🏭 Storage Module</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor energy usage and emissions for peach cold storage</p>
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
        <EmissionCard title="Total Storage Emissions" value={totalEmission} icon="🏭" color="violet" />
        <EmissionCard title="Total Records" value={records.length} unit="entries" icon="📋" color="amber" />
        <EmissionCard title="Avg per Entry" value={records.length ? totalEmission / records.length : 0} icon="⚡" color="sky" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Add Storage Usage</h2>
        {error   && <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-violet-900/30 border border-violet-700/50 rounded-xl text-violet-400 text-sm">{success}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Facility Name *</label>
            <input type="text" value={form.facility_name} onChange={(e) => setForm({ ...form, facility_name: e.target.value })}
              placeholder="e.g. Swat Cold Room A" required
              className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Farm (optional)</label>
            <select value={form.farm_id} onChange={(e) => setForm({ ...form, farm_id: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 text-white rounded-xl px-3 py-2 text-sm outline-none">
              <option value="">None</option>
              {farms.map(f => <option key={f.farm_id} value={f.farm_id}>{f.farm_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Start Date *</label>
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 text-white rounded-xl px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">End Date *</label>
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 text-white rounded-xl px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Grid Region</label>
            <select value={form.grid_region} onChange={(e) => setForm({ ...form, grid_region: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 text-white rounded-xl px-3 py-2 text-sm outline-none">
              {gridRegions.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Refrigerant Type</label>
            <select value={form.refrigerant_type} onChange={(e) => setForm({ ...form, refrigerant_type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 text-white rounded-xl px-3 py-2 text-sm outline-none">
              {refrigerantTypes.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {[
            { label: 'Electricity (kWh) *', key: 'electricity_kwh' },
            { label: 'Refrigerant Leaked (kg)', key: 'refrigerant_leaked_kg' },
            { label: 'Capacity (tonnes) *', key: 'capacity_tonnes' },
            { label: 'Product Stored (tonnes) *', key: 'product_stored_tonnes' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-gray-400 text-xs mb-1">{label}</label>
              <input type="number" step="0.001" min="0" value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={label.includes('*')} placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
            </div>
          ))}
          <div>
            <label className="block text-gray-400 text-xs mb-1">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional" className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900 text-white font-semibold rounded-xl transition-colors text-sm">
              {submitting ? 'Saving...' : '+ Add Record'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Storage Records</h2>
        {loading ? <p className="text-gray-500 text-sm">Loading...</p> :
         records.length === 0 ? <p className="text-gray-500 text-sm">No storage records yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Facility','Start','End','Days','kWh','Refrigerant','CO₂e kg',''].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {records.map((r) => (
                  <tr key={r.storage_id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-300">{r.facility_name}</td>
                    <td className="py-3 pr-4 text-gray-400">{r.start_date?.split('T')[0]}</td>
                    <td className="py-3 pr-4 text-gray-400">{r.end_date?.split('T')[0]}</td>
                    <td className="py-3 pr-4 text-gray-300">{r.duration_days}</td>
                    <td className="py-3 pr-4 text-gray-300">{r.electricity_kwh}</td>
                    <td className="py-3 pr-4"><span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-lg text-xs">{r.refrigerant_type}</span></td>
                    <td className="py-3 pr-4 text-amber-400 font-semibold">{parseFloat(r.total_co2e_kg || 0).toFixed(3)}</td>
                    <td className="py-3">
                      <button onClick={() => handleDelete(r.storage_id)}
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
