import { longevityFromCode, sillageFromCode, ratingToPercent } from '../../lib/performance';
import './PerformancePanel.css';

// 2×2 Glas-Panel wie in der App. Longevity und Sillage: Community-Durchschnitt
// (Prozent aus Reviews), sonst der Katalog-Code. Bottle und Value: 0–5-Schnitt.
export default function PerformancePanel({ perfume, summary }) {
  const longevity = pick(summary?.avg_longevity, longevityFromCode(perfume?.longevity_code));
  const sillage = pick(summary?.avg_sillage, sillageFromCode(perfume?.sillage_code));
  const bottle = stars(perfume?.avg_bottle_rating);
  const value = stars(perfume?.avg_value_rating);

  const rows = [
    { label: 'Longevity', ...longevity },
    { label: 'Sillage', ...sillage },
    { label: 'Bottle', ...bottle },
    { label: 'Value', ...value },
  ];

  return (
    <section className="perf glass">
      <h2 className="perf__title">Performance</h2>
      <div className="perf__grid">
        {rows.map(({ label, text, percent }) => (
          <div key={label} className="perf__item">
            <div className="perf__head">
              <span>{label}</span>
              <strong>{text}</strong>
            </div>
            <div className="perf__track"><div className="perf__fill" style={{ width: `${percent}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function pick(avgPercent, fromCode) {
  if (avgPercent != null && avgPercent !== '') {
    const percent = Math.round(Number(avgPercent));
    return { text: `${percent}%`, percent };
  }
  if (fromCode) return { text: fromCode.label, percent: fromCode.percent };
  return { text: '—', percent: 0 };
}

function stars(rating) {
  const percent = ratingToPercent(rating);
  return percent == null ? { text: '—', percent: 0 } : { text: Number(rating).toFixed(1), percent };
}
