import { Link } from 'react-router-dom';
import { Bookmark, Heart, Star } from '@phosphor-icons/react';
import { usePerfumeStatus } from '../../hooks/usePerfumeStatus';
import AddToListButton from './AddToListButton';
import './ActionTiles.css';

const TILES = [
  { field: 'is_want_to_try', label: 'Want to try', Icon: Bookmark },
  { field: 'is_owned', label: 'Collection', Icon: Star },
  { field: 'is_favorite', label: 'Favorite', Icon: Heart },
];

// Vier Glas-Kacheln wie in der App: drei Status-Toggles plus "Add to list".
export default function ActionTiles({ perfumeId }) {
  const { isAuthenticated, status, toggle } = usePerfumeStatus(perfumeId);

  if (!isAuthenticated) {
    return (
      <div className="action-tiles action-tiles--guest glass">
        <Link to="/login">Sign in to track this fragrance</Link>
      </div>
    );
  }

  return (
    <div className="action-tiles">
      {TILES.map((tile) => {
        const { field, label } = tile;
        const Icon = tile.Icon;
        const on = !!status[field];
        return (
          <button
            key={field}
            type="button"
            className={`action-tile ${on ? 'action-tile--on' : ''}`}
            aria-pressed={on}
            onClick={() => toggle(field)}
          >
            <Icon size={16} weight={on ? 'fill' : 'regular'} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
      <AddToListButton perfumeId={perfumeId} />
    </div>
  );
}
