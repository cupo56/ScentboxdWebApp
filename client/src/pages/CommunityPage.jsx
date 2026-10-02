import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useActivityFeed } from '../hooks/useActivityFeed';
import ActivityRow from '../components/community/ActivityRow';
import './CommunityPage.css';

const PAGE = 20;

// Aktivitäts-Feed in voller Länge. Eingeloggte können zwischen den Leuten,
// denen sie folgen, und allen umschalten; Besucher sehen alle.
export default function CommunityPage() {
  const { isAuthenticated } = useAuth();
  const [scope, setScope] = useState('following');
  const [limit, setLimit] = useState(PAGE);
  const effectiveScope = isAuthenticated ? scope : 'everyone';
  const { items, loading } = useActivityFeed({ limit, scope: effectiveScope });

  const emptyText = effectiveScope === 'following'
    ? 'Nobody you follow has posted yet. Switch to Everyone to see what the community is rating.'
    : 'No reviews yet. Be the first to rate a fragrance.';

  return (
    <div className="container page community">
      <header className="community__head">
        <h1 className="community__title">Community</h1>
        {isAuthenticated && (
          <div className="community__scope" role="group" aria-label="Feed scope">
            <button type="button" className="chip" aria-pressed={scope === 'following'} onClick={() => setScope('following')}>
              Following
            </button>
            <button type="button" className="chip" aria-pressed={scope === 'everyone'} onClick={() => setScope('everyone')}>
              Everyone
            </button>
          </div>
        )}
      </header>

      <div className="community__feed glass">
        {items.map((r) => <ActivityRow key={r.id} review={r} />)}
        {loading && items.length === 0 && (
          <div className="spinner-container"><div className="spinner spinner-md" /></div>
        )}
        {!loading && items.length === 0 && <p className="community__empty">{emptyText}</p>}
      </div>

      {items.length >= limit && (
        <button type="button" className="btn btn-secondary community__more" onClick={() => setLimit((l) => l + PAGE)}>
          Load more
        </button>
      )}
    </div>
  );
}
