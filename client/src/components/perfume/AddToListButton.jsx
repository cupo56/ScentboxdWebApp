import { useState, useEffect, useRef } from 'react';
import { ListPlus } from '@phosphor-icons/react';
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
        type="button"
        className={`action-tile ${open ? 'action-tile--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <ListPlus size={16} aria-hidden="true" />
        <span>Add to list</span>
      </button>

      {open && (
        <div className="add-to-list__dropdown" role="menu">
          {lists.length === 0 ? (
            <p className="add-to-list__empty">No lists yet. Create one on your profile.</p>
          ) : (
            lists.map((list) => {
              const state = feedback[list.id];
              return (
                <button
                  key={list.id}
                  role="menuitem"
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
