import './FilterBar.css';

const CATEGORIES = ['Alle', 'Herren', 'Damen', 'Unisex'];

export default function FilterBar({ activeCategory, onCategoryChange, onSortChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-bar__categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-bar__pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <select className="filter-bar__sort" onChange={(e) => onSortChange(e.target.value)}>
        <option value="">Sortierung</option>
        <option value="price">Preis aufsteigend</option>
        <option value="-price">Preis absteigend</option>
        <option value="name">Name A-Z</option>
        <option value="-name">Name Z-A</option>
      </select>
    </div>
  );
}
