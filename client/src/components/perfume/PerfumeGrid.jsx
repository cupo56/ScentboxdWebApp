import PerfumeCard from './PerfumeCard';
import './PerfumeGrid.css';

export default function PerfumeGrid({ perfumes, loading, ratingsMap }) {
  if (loading) {
    return (
      <div className="perfume-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="perfume-card-skeleton card">
            <div className="skeleton" style={{ aspectRatio: '3/4' }} />
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="skeleton" style={{ height: '12px', width: '40%' }} />
              <div className="skeleton" style={{ height: '16px', width: '80%' }} />
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
      {perfumes.map((perfume) => {
        const rating = ratingsMap?.get(perfume.id);
        return (
          <PerfumeCard
            key={perfume.id}
            perfume={perfume}
            avgRating={rating?.avg_rating}
            reviewCount={rating?.review_count}
          />
        );
      })}
    </div>
  );
}
