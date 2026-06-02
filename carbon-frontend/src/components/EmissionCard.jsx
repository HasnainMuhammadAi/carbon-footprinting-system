export default function EmissionCard({ title, value, unit = 'kg CO₂e', icon, trend, color = 'emerald' }) {
  const colorMap = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400',
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
    sky: 'border-sky-500/30 bg-sky-500/5 text-sky-400',
    violet: 'border-violet-500/30 bg-violet-500/5 text-violet-400',
    rose: 'border-rose-500/30 bg-rose-500/5 text-rose-400',
  };

  const trendColor = trend > 0 ? 'text-red-400' : 'text-emerald-400';
  const trendIcon = trend > 0 ? '↑' : '↓';

  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]} transition-all duration-200 hover:scale-[1.01]`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trendColor}`}>
            {trendIcon} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">{title}</p>
      <p className="text-white text-2xl font-bold">
        {typeof value === 'number' ? value.toFixed(2) : value}
        <span className="text-gray-500 text-sm font-normal ml-1">{unit}</span>
      </p>
    </div>
  );
}
