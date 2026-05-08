import { useState, useEffect } from 'react';
import { getUserLists, addToList } from '../../services/listService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../store/toastStore';
import './AddToListModal.css';

export default function AddToListModal({ perfumeId, perfumeName, onClose }) {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserLists(user.id)
      .then(setLists)
      .catch((err) => toast.error('Failed to load lists: ' + err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const handleAdd = async (listId) => {
    try {
      setSaving(true);
      await addToList(listId, perfumeId);
      toast.success(`Added ${perfumeName} to list!`);
      onClose();
    } catch (err) {
      if (err.code === '23505') {
        toast.info('This fragrance is already in that list.');
      } else {
        toast.error('Failed to add to list: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add to List</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <p className="modal-subtitle">Select a list to add <strong>{perfumeName}</strong> to:</p>
          
          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : lists.length > 0 ? (
            <div className="list-selection">
              {lists.map((list) => (
                <button
                  key={list.id}
                  className="list-select-btn"
                  onClick={() => handleAdd(list.id)}
                  disabled={saving}
                >
                  <span className="list-select-name">{list.name}</span>
                  <span className="list-select-meta">
                    {list.is_public ? '🌐 Public' : '🔒 Private'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>You don't have any lists yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
