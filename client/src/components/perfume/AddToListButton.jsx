import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUserLists, addToList } from '../../services/listService';
import './AddToListButton.css';

export default function AddToListButton({ perfumeId }) {
  const { user, isAuthenticated } = useAuth();
  const [lists, setLists] = useState([]);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState({}); // { [listId]: 'added' | 'exists' | 'error' }
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    getUserLists(user.id).then(setLists).catch(() => {});
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!isAuthenticated) return null;

  const handleAdd = async (listId) => {
    try {
      await addToList(listId, perfumeId);
      setFeedback((prev) => ({ ...prev, [listId]: 'added' }));
    } catch (err) {
      // Unique constraint violation = already in list
      const isdup = err.code === '23505' || err.message?.includes('duplicate');
      setFeedback((prev) => ({ ...prev, [listId]: isdup ? 'exists' : 'error' }));
    }
  };

  const icons = { added: '✓', exists: '–', error: '!' };

  return (
    <div className="add-to-list" ref={dropdownRef}>
      <button
        className="user-actions__btn"
        onClick={() => setOpen((o) => !o)}
        title="Add to List"
      >
        <span className="user-actions__icon">📋</span>
        <span className="user-actions__label">Add to List</span>
      </button>

      {open && (
        <div className="add-to-list__dropdown">
          {lists.length === 0 ? (
            <p className="add-to-list__empty">No lists yet. Create one on your profile.</p>
          ) : (
            lists.map((list) => {
              const state = feedback[list.id];
              return (
                <button
                  key={list.id}
                  className={`add-to-list__item ${state ? `add-to-list__item--${state}` : ''}`}
                  onClick={() => handleAdd(list.id)}
                  disabled={!!state}
                >
                  <span className="add-to-list__item-name">{list.name}</span>
                  {state && <span className="add-to-list__item-icon">{icons[state]}</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
