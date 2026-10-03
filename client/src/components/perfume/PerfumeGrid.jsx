import PerfumeCard from './PerfumeCard';
import './PerfumeGrid.css';

export default function PerfumeGrid({ perfumes, loading }) {
  if (loading) {
    return (
      <div className="perfume-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="perfume-card-skeleton">
            <div className="skeleton" style={{ aspectRatio: '3/4' }} />
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="skeleton" style={{ height: '11px', width: '30%' }} />
              <div className="skeleton" style={{ height: '15px', width: '85%' }} />
              <div className="skeleton" style={{ height: '11px', width: '50%' }} />
              <div className="skeleton" style={{ height: '18px', width: '36px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!perfumes?.length) {
    return (
      <div className="empty-state">
        <div className="icon">🔍</div>
        <h3>No fragrances found</h3>
        <p>Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="perfume-grid">
      {perfumes.map((perfume) => (
        <PerfumeCard key={perfume.id} perfume={perfume} />
      ))}
    </div>
  );
}
