import { LONGEVITY_OPTIONS } from '../../lib/catalog';
import './FilterPanel.css';

function Group({ label, children }) {
  return (
    <div className="filter-panel__group">
      <span className="eyebrow filter-panel__label">{label}</span>
      {children}
    </div>
  );
}

function CheckItem({ active, onClick, children }) {
  return (
    <button type="button" className={`filter-panel__check-item ${active ? 'active' : ''}`} onClick={onClick} aria-pressed={active}>
      <span className="filter-panel__check-box" aria-hidden="true" />
      {children}
    </button>
  );
}

export default function FilterPanel({
  concentrations, concentration, onConcentrationChange,
  noteFamilies, noteFamily, onNoteFamilyChange,
  longevityLevels, longevity, onLongevityChange,
  onReset,
}) {
  const longevityOptions = LONGEVITY_OPTIONS.filter((o) => longevityLevels.includes(o.code));

  return (
    <div className="filter-panel glass">
      <Group label="Note family">
        <div className="filter-panel__chips">
          {noteFamilies.map((nf) => (
            <button key={nf} type="button" className="chip" aria-pressed={noteFamily === nf} onClick={() => onNoteFamilyChange(noteFamily === nf ? '' : nf)}>
              {nf}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Concentration">
        <div className="filter-panel__check-list">
          {concentrations.map((c) => (
            <CheckItem key={c} active={concentration === c} onClick={() => onConcentrationChange(concentration === c ? '' : c)}>{c}</CheckItem>
          ))}
        </div>
      </Group>

      <Group label="Longevity">
        <div className="filter-panel__check-list">
          {longevityOptions.map((o) => (
            <CheckItem key={o.code} active={longevity === o.code} onClick={() => onLongevityChange(longevity === o.code ? '' : o.code)}>{o.label}</CheckItem>
          ))}
        </div>
      </Group>

      <button type="button" className="btn btn-ghost btn-sm filter-panel__reset" onClick={onReset}>Reset all filters</button>
    </div>
  );
}
