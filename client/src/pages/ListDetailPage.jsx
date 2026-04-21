import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getListById } from '../services/listService';
import PerfumeCard from '../components/perfume/PerfumeCard';
import './ListDetailPage.css';

export default function ListDetailPage() {
  const { id } = useParams();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListById(id)
      .then(setList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h3>List not found</h3>
        </div>
      </div>
    );
  }

  const perfumes = list.list_items
    ?.map((item) => item.perfumes)
    .filter(Boolean) || [];

  return (
    <div className="list-detail page">
      <div className="container">
        <header className="list-detail__header">
          <h1 className="list-detail__name">{list.name}</h1>
          {list.description && (
            <p className="list-detail__desc">{list.description}</p>
          )}
          <div className="list-detail__meta">
            {list.profiles?.username && (
              <Link to={`/profile/${list.profiles.username}`} className="list-detail__author">
                by @{list.profiles.username}
              </Link>
            )}
            <span className="badge badge-accent">
              {perfumes.length} fragrance{perfumes.length !== 1 ? 's' : ''}
            </span>
            <span className="badge badge-accent">
              {list.is_public ? '🌐 Public' : '🔒 Private'}
            </span>
          </div>
        </header>

        {perfumes.length > 0 ? (
          <div className="perfume-grid">
            {perfumes.map((p) => (
              <PerfumeCard key={p.id} perfume={p} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>This list is empty</h3>
          </div>
        )}
      </div>
    </div>
  );
}
