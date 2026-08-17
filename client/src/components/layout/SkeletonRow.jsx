import './SkeletonRow.css';

export default function SkeletonRow({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-row">
          <div className="skeleton skeleton-row__thumb" />
          <div className="skeleton-row__lines">
            <div className="skeleton" style={{ height: 14, width: '60%' }} />
            <div className="skeleton" style={{ height: 11, width: '38%', marginTop: 8 }} />
          </div>
          <div className="skeleton" style={{ height: 14, width: 40 }} />
        </div>
      ))}
    </>
  );
}
