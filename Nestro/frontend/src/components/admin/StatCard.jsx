export default function StatCard({ label, value, sub, changePct, Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      {Icon && (
        <div className={`p-3 rounded-lg shrink-0 ${tones[tone]}`}>
          <Icon className="text-xl" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5 tabular-nums">{value}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {changePct !== null && changePct !== undefined && (
            <span className={`text-[11px] font-medium tabular-nums ${changePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct)}%
            </span>
          )}
          {sub && <span className="text-[11px] text-gray-400">{sub}</span>}
        </div>
      </div>
    </div>
  )
}
