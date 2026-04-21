import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserPerfumeStatus, togglePerfumeStatus } from '../../services/userPerfumeService';
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
      const updated = await togglePerfumeStatus(perfumeId, field);
      setStatus(updated);
    } catch (err) {
      console.error('Toggle failed:', err);
    }
    setLoading(false);
  };

  const actions = [
    { field: 'is_favorite', icon: '❤️', inactiveIcon: '🤍', label: 'Favorite' },
    { field: 'is_owned', icon: '📦', inactiveIcon: '📦', label: 'Owned' },
    { field: 'is_want_to_try', icon: '🧪', inactiveIcon: '🧪', label: 'Want to Try' },
  ];

  return (
    <div className="user-actions" id="user-perfume-actions">
      {actions.map(({ field, icon, inactiveIcon, label }) => {
        const active = status?.[field] || false;
        return (
          <button
            key={field}
            className={`user-actions__btn ${active ? 'active' : ''}`}
            onClick={() => handleToggle(field)}
            disabled={loading}
            title={label}
          >
            <span className="user-actions__icon">{active ? icon : inactiveIcon}</span>
            <span className="user-actions__label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
