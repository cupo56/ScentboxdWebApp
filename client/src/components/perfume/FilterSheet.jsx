import FilterPanel from './FilterPanel';
import './FilterSheet.css';

export default function FilterSheet({ open, onClose, resultCount, ...filterProps }) {
  if (!open) return null;
  return (
    <div className="filter-sheet__backdrop" onClick={onClose}>
      <div className="filter-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="filter-sheet__handle" />
        <div className="filter-sheet__header">
          <span>Filters</span>
          <button type="button" onClick={filterProps.onReset}>Reset</button>
        </div>
        <div className="filter-sheet__body">
          <FilterPanel {...filterProps} />
        </div>
        <button type="button" className="btn btn-primary filter-sheet__apply" onClick={onClose}>
          Show {resultCount} entries
        </button>
      </div>
    </div>
  );
}
