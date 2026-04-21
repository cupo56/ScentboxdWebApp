import './PerformanceBar.css';

export default function PerformanceBar({ label, value, maxValue = 100, icon }) {
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className="perf-bar">
      <div className="perf-bar__header">
        <span className="perf-bar__label">
          {icon && <span className="perf-bar__icon">{icon}</span>}
          {label}
        </span>
        <span className="perf-bar__value">{value !== null && value !== undefined ? value : '—'}</span>
      </div>
      <div className="perf-bar__track">
        <div
          className="perf-bar__fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
