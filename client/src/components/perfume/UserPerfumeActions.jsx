import { useState, useEffect } from 'react';
import { Check, Heart } from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';
import { getUserPerfumeStatus, togglePerfumeStatus } from '../../services/userPerfumeService';
import { toast } from '../../store/toastStore';
import './UserPerfumeActions.css';

export default function UserPerfumeActions({ perfumeId }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !perfumeId) return;
    getUserPerfumeStatus(perfumeId).then(setStatus).catch(() => {});
  }, [isAuthenticated, perfumeId]);

  if (!isAuthenticated) return null;

  const handleToggle = async (field) => {
    if (loading) return;
    setLoading(true);
    try {
      setStatus(await togglePerfumeStatus(perfumeId, field));
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    }
    setLoading(false);
  };

  const owned = status?.is_owned || false;
  const wantToTry = status?.is_want_to_try || false;
  const favorite = status?.is_favorite || false;

  return (
    <div className="user-actions">
      <div className="user-actions__top">
        <button
          className={`btn user-actions__primary ${owned ? 'user-actions__primary--active' : ''}`}
          onClick={() => handleToggle('is_owned')}
          disabled={loading}
        >
          On my shelf {owned && <Check size={14} weight="bold" aria-hidden="true" />}
        </button>
        <button
          className={`user-actions__favorite ${favorite ? 'user-actions__favorite--active' : ''}`}
          onClick={() => handleToggle('is_favorite')}
          disabled={loading}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={favorite}
        >
          <Heart size={16} weight={favorite ? 'fill' : 'regular'} aria-hidden="true" />
        </button>
      </div>
      <button
        className={`btn btn-secondary ${wantToTry ? 'user-actions__secondary--active' : ''}`}
        onClick={() => handleToggle('is_want_to_try')}
        disabled={loading}
      >
        Want to try
      </button>
    </div>
  );
}
