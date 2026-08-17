const SORT_OPTIONS = [
  { value: 'performance', label: 'Best rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
];

export default function FilterPanel({
  sortBy, onSortChange,
  concentrations, concentration, onConcentrationChange,
  noteFamilies, noteFamily, onNoteFamilyChange,
  longevityLevels, longevity, onLongevityChange,
  onReset,
}) {
  return (
    <div className="filter-panel">
      <div className="filter-panel__group">
        <div className="filter-panel__label">Sort</div>
        <div className="filter-panel__sort-list">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`filter-panel__sort-item ${sortBy === opt.value ? 'active' : ''}`}
              onClick={() => onSortChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label">Concentration</div>
        <div className="filter-panel__check-list">
          {concentrations.map((c) => (
            <button
              key={c}
              type="button"
              className={`filter-panel__check-item ${concentration === c ? 'active' : ''}`}
              onClick={() => onConcentrationChange(concentration === c ? '' : c)}
            >
              <span className="filter-panel__check-box" aria-hidden="true">{concentration === c ? '◼' : '◻'}</span>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label">Note family</div>
        <div className="filter-panel__chips">
          {noteFamilies.map((nf) => (
            <button
              key={nf}
              type="button"
              className="chip"
              aria-pressed={noteFamily === nf}
              onClick={() => onNoteFamilyChange(noteFamily === nf ? '' : nf)}
            >
              {nf}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-panel__group">
        <div className="filter-panel__label">Longevity</div>
        <div className="filter-panel__check-list">
          {longevityLevels.map((l) => (
            <button
              key={l}
              type="button"
              className={`filter-panel__check-item ${longevity === l ? 'active' : ''}`}
              onClick={() => onLongevityChange(longevity === l ? '' : l)}
            >
              <span className="filter-panel__check-box" aria-hidden="true">{longevity === l ? '◼' : '◻'}</span>
              {l}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="filter-panel__reset" onClick={onReset}>Reset all filters</button>
    </div>
  );
}
