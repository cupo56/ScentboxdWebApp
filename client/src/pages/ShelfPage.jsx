import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { toast } from '../store/toastStore';
import PerfumeGrid from '../components/perfume/PerfumeGrid';
import './ShelfPage.css';

const STATUSES = {
  favorite: {
    field: 'is_favorite',
    title: 'Favorites',
    empty: 'No favorites yet. Tap the heart on any fragrance to keep it here.',
  },
  owned: {
    field: 'is_owned',
    title: 'Collection',
    empty: 'Nothing in your collection yet. Add the bottle you wore today.',
  },
};

// Favorites und Collection des eingeloggten Users. Wird nur hinter
// RequireAuth gerendert, `user` ist also immer gesetzt.
export default function ShelfPage({ status }) {
  const { user } = useAuth();
  const { field, title, empty } = STATUSES[status];
  // `loaded` merkt sich, für welches Feld die Daten gelten; beim Wechsel
  // Favorites <-> Collection ist `loading` damit sofort wieder true.
  const [loaded, setLoaded] = useState({ field: null, perfumes: [] });
  const loading = loaded.field !== field;
  const perfumes = loaded.perfumes;

  useEffect(() => {
    let active = true;
    getUserPerfumesByStatus(user.id, field)
      .then((rows) => {
        if (active) setLoaded({ field, perfumes: rows.map((r) => r.perfumes).filter(Boolean) });
      })
      .catch((err) => {
        toast.error(`Failed to load ${title.toLowerCase()}: ` + err.message);
        if (active) setLoaded({ field, perfumes: [] });
      });
    return () => {
      active = false;
    };
  }, [user.id, field, title]);

  const count = perfumes.length;

  return (
    <div className="container page shelf-page">
      <header className="shelf-page__head">
        <h1 className="shelf-page__title">{title}</h1>
        {!loading && (
          <span className="shelf-page__count">
            {count} {count === 1 ? 'fragrance' : 'fragrances'}
          </span>
        )}
      </header>

      {!loading && count === 0 ? (
        <div className="shelf-page__empty glass">
          <p>{empty}</p>
          <Link to="/catalog" className="btn btn-primary">Browse the catalog</Link>
        </div>
      ) : (
        <PerfumeGrid perfumes={perfumes} loading={loading} />
      )}
    </div>
  );
}
