import './PerformanceBar.css';

export default function PerformanceBar({ label, value, maxValue = 100, suffix = '' }) {
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));
  return (
    <div className="perf-bar">
      <div className="perf-bar__header">
        <span>{label}</span>
        <span>{value !== null && value !== undefined ? `${value}${suffix}` : '—'}</span>
      </div>
      <div className="perf-bar__track">
        <div className="perf-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
