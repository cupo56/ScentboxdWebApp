import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page container">
      <div className="empty-state" style={{ paddingTop: '120px' }}>
        <div className="icon" style={{ fontSize: '5rem' }}>🔮</div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Page not found</h3>
        <p>This fragrance seems to have evaporated.</p>
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary">Back Home</Link>
          <Link to="/explore" className="btn btn-secondary">Explore Fragrances</Link>
        </div>
      </div>
    </div>
  );
}
