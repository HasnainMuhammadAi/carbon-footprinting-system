import { useEffect, useState } from 'react';
import api from '../api/axios';
import EmissionCard from '../components/EmissionCard';
import FaceEnroll from '../components/FaceEnroll';

const defaultForm = {
  origin_farm_id: '', trip_date: '', destination_city: '', distance_km: '',
  return_trip: 0, vehicle_type: 'truck_medium', fuel_type: 'diesel',
  fuel_consumed_litres: '', load_weight_tonnes: '', peach_crates_count: '', notes: '',
};
const vehicleTypes = ['truck_heavy', 'truck_medium', 'pickup', 'van', 'motorcycle'];
const fuelTypes    = ['diesel', 'petrol', 'cng', 'electric'];

export default function TransportPanel() {
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
      const [trRes, farmRes] = await Promise.all([api.get('/transport'), api.get('/farms')]);
      setRecords(trRes.data.data || []); setFarms(farmRes.data.data || []);
    } catch { setError('Failed to load transport data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
    try {
      await api.post('/transport', { ...form, return_trip: form.return_trip ? 1 : 0 });
      setSuccess('Transport record added.'); setForm(defaultForm); fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Failed to add record.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/transport/${id}`); fetchData(); }
    catch { setError('Failed to delete.'); }
  };

  const totalEmission = records.reduce((s, r) => s + parseFloat(r.total_co2e_kg || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">🚚 Transport Module</h1>
          <p className="text-gray-500 text-sm mt-1">Track vehicle emissions for peach transport operations</p>
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
        <EmissionCard title="Total Transport Emissions" value={totalEmission} icon="🚚" color="sky" />
        <EmissionCard title="Total Trips" value={records.length} unit="trips" icon="🗺️" color="amber" />
        <EmissionCard title="Avg per Trip" value={records.length ? totalEmission / records.length : 0} icon="📏" color="violet" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Add Transport Record</h2>
        {error   && <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-sky-900/30 border border-sky-700/50 rounded-xl text-sky-400 text-sm">{success}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Origin Farm *</label>
            <select value={form.origin_farm_id} onChange={(e) => setForm({ ...form, origin_farm_id: e.target.value })}
              required className="w-full bg-gray-800 border border-gray-700 focus:border-sky-500 text-white rounded-xl px-3 py-2 text-sm outline-none">
              <option value="">Select Farm</option>
              {farms.map(f => <option key={f.farm_id} value={f.farm_id}>{f.farm_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Trip Date *</label>
            <input type="date" value={form.trip_date} onChange={(e) => setForm({ ...form, trip_date: e.target.value })}
              required className="w-full bg-gray-800 border border-gray-700 focus:border-sky-500 text-white rounded-xl px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Destination City *</label>
            <input type="text" value={form.destination_city} onChange={(e) => setForm({ ...form, destination_city: e.target.value })}
              placeholder="e.g. Peshawar" required className="w-full bg-gray-800 border border-gray-700 focus:border-sky-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Vehicle Type *</label>
            <select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 focus:border-sky-500 text-white rounded-xl px-3 py-2 text-sm outline-none">
              {vehicleTypes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Fuel Type *</label>
            <select value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 focus:border-sky-500 text-white rounded-xl px-3 py-2 text-sm outline-none">
              {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          {[
            { label: 'Distance (km) *', key: 'distance_km' },
            { label: 'Fuel Consumed (litres)', key: 'fuel_consumed_litres' },
            { label: 'Load Weight (tonnes) *', key: 'load_weight_tonnes' },
            { label: 'Peach Crates Count', key: 'peach_crates_count' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-gray-400 text-xs mb-1">{label}</label>
              <input type="number" step="0.01" min="0" value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={label.includes('*')} placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 focus:border-sky-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
            </div>
          ))}
          <div className="flex items-center gap-3 mt-4">
            <input type="checkbox" id="return_trip" checked={!!form.return_trip}
              onChange={(e) => setForm({ ...form, return_trip: e.target.checked ? 1 : 0 })}
              className="w-4 h-4 accent-sky-500" />
            <label htmlFor="return_trip" className="text-gray-400 text-sm">Return Trip (doubles distance)</label>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Swat to Mingora market"
              className="w-full bg-gray-800 border border-gray-700 focus:border-sky-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-900 text-white font-semibold rounded-xl transition-colors text-sm">
              {submitting ? 'Saving...' : '+ Add Record'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Transport Records</h2>
        {loading ? <p className="text-gray-500 text-sm">Loading...</p> :
         records.length === 0 ? <p className="text-gray-500 text-sm">No transport records yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Farm','Date','Destination','Vehicle','Fuel','km','Load t','CO₂e kg',''].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {records.map((r) => (
                  <tr key={r.trip_id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-300">{r.farm_name || r.origin_farm_id}</td>
                    <td className="py-3 pr-4 text-gray-400">{r.trip_date?.split('T')[0]}</td>
                    <td className="py-3 pr-4 text-gray-300">{r.destination_city}</td>
                    <td className="py-3 pr-4"><span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-lg text-xs">{r.vehicle_type}</span></td>
                    <td className="py-3 pr-4 text-gray-400">{r.fuel_type}</td>
                    <td className="py-3 pr-4 text-gray-300">{r.distance_km}</td>
                    <td className="py-3 pr-4 text-gray-300">{r.load_weight_tonnes}</td>
                    <td className="py-3 pr-4 text-amber-400 font-semibold">{parseFloat(r.total_co2e_kg || 0).toFixed(3)}</td>
                    <td className="py-3">
                      <button onClick={() => handleDelete(r.trip_id)}
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
