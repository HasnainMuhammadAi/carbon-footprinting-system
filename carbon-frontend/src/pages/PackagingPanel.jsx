import { useEffect, useState } from 'react';
import api from '../api/axios';
import EmissionCard from '../components/EmissionCard';
import FaceEnroll from '../components/FaceEnroll';

const defaultForm = {
  farm_id: '', batch_date: '', material_type: 'cardboard_box', material_weight_kg: '',
  recycled_content_pct: '', units_packaged: '', avg_unit_weight_kg: '',
  packaging_waste_kg: '', waste_disposal: 'landfill', notes: '',
};
const materialTypes  = ['cardboard_box', 'plastic_crate', 'wooden_crate', 'foam_tray', 'biodegradable_wrap'];
const wasteDisposals = ['landfill', 'recycled', 'incinerated', 'composted'];

export default function PackagingPanel() {
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
      const [pkRes, farmRes] = await Promise.all([api.get('/packaging'), api.get('/farms')]);
      setRecords(pkRes.data.data || []); setFarms(farmRes.data.data || []);
    } catch { setError('Failed to load packaging data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
    try {
      await api.post('/packaging', form);
      setSuccess('Packaging batch recorded.'); setForm(defaultForm); fetchData();
    } catch (err) { setError(err.response?.data?.error || 'Failed to add record.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/packaging/${id}`); fetchData(); }
    catch { setError('Failed to delete.'); }
  };

  const totalEmission = records.reduce((s, r) => s + parseFloat(r.total_co2e_kg || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">📦 Packaging Module</h1>
          <p className="text-gray-500 text-sm mt-1">Track packaging material emissions for peach products</p>
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
        <EmissionCard title="Total Packaging Emissions" value={totalEmission} icon="📦" color="rose" />
        <EmissionCard title="Total Batches" value={records.length} unit="entries" icon="📋" color="amber" />
        <EmissionCard title="Avg per Batch" value={records.length ? totalEmission / records.length : 0} icon="⚖️" color="sky" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Add Packaging Batch</h2>
        {error   && <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-rose-900/30 border border-rose-700/50 rounded-xl text-rose-400 text-sm">{success}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Farm (optional)</label>
            <select value={form.farm_id} onChange={(e) => setForm({ ...form, farm_id: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 focus:border-rose-500 text-white rounded-xl px-3 py-2 text-sm outline-none">
              <option value="">None</option>
              {farms.map(f => <option key={f.farm_id} value={f.farm_id}>{f.farm_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Batch Date *</label>
            <input type="date" value={form.batch_date} onChange={(e) => setForm({ ...form, batch_date: e.target.value })} required
              className="w-full bg-gray-800 border border-gray-700 focus:border-rose-500 text-white rounded-xl px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Material Type *</label>
            <select value={form.material_type} onChange={(e) => setForm({ ...form, material_type: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 focus:border-rose-500 text-white rounded-xl px-3 py-2 text-sm outline-none">
              {materialTypes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Waste Disposal</label>
            <select value={form.waste_disposal} onChange={(e) => setForm({ ...form, waste_disposal: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 focus:border-rose-500 text-white rounded-xl px-3 py-2 text-sm outline-none">
              {wasteDisposals.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          {[
            { label: 'Material Weight (kg) *', key: 'material_weight_kg' },
            { label: 'Recycled Content (%)', key: 'recycled_content_pct' },
            { label: 'Units Packaged *', key: 'units_packaged' },
            { label: 'Avg Unit Weight (kg) *', key: 'avg_unit_weight_kg' },
            { label: 'Packaging Waste (kg)', key: 'packaging_waste_kg' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-gray-400 text-xs mb-1">{label}</label>
              <input type="number" step="0.001" min="0" value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={label.includes('*')} placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 focus:border-rose-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
            </div>
          ))}
          <div>
            <label className="block text-gray-400 text-xs mb-1">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional" className="w-full bg-gray-800 border border-gray-700 focus:border-rose-500 text-white rounded-xl px-3 py-2 text-sm outline-none placeholder-gray-600" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 text-white font-semibold rounded-xl transition-colors text-sm">
              {submitting ? 'Saving...' : '+ Add Batch'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Packaging Records</h2>
        {loading ? <p className="text-gray-500 text-sm">Loading...</p> :
         records.length === 0 ? <p className="text-gray-500 text-sm">No packaging records yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Date','Material','Weight kg','Units','Recycled %','Waste kg','CO₂e kg',''].map(h => (
                    <th key={h} className="text-left text-gray-500 text-xs uppercase tracking-wider pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {records.map((r) => (
                  <tr key={r.batch_id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 pr-4 text-gray-400">{r.batch_date?.split('T')[0]}</td>
                    <td className="py-3 pr-4"><span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-lg text-xs">{r.material_type}</span></td>
                    <td className="py-3 pr-4 text-gray-300">{r.material_weight_kg}</td>
                    <td className="py-3 pr-4 text-gray-300">{r.units_packaged}</td>
                    <td className="py-3 pr-4 text-gray-300">{r.recycled_content_pct}%</td>
                    <td className="py-3 pr-4 text-gray-300">{r.packaging_waste_kg}</td>
                    <td className="py-3 pr-4 text-amber-400 font-semibold">{parseFloat(r.total_co2e_kg || 0).toFixed(3)}</td>
                    <td className="py-3">
                      <button onClick={() => handleDelete(r.batch_id)}
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
