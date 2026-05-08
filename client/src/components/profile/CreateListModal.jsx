import { useState } from 'react';
import { createList } from '../../services/listService';
import { toast } from '../../store/toastStore';
import './CreateListModal.css';

export default function CreateListModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      const newList = await createList({
        name: name.trim(),
        description: description.trim(),
        is_public: isPublic
      });
      toast.success('List created successfully!');
      onCreated(newList);
      onClose();
    } catch (err) {
      toast.error('Failed to create list: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New List</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body create-list-form">
          <div className="form-group">
            <label htmlFor="list-name">List Name</label>
            <input
              id="list-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Freshies"
              required
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="list-desc">Description (Optional)</label>
            <textarea
              id="list-desc"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this list about?"
              rows="3"
            />
          </div>
          
          <div className="form-group checkbox-group">
            <input
              id="list-public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <label htmlFor="list-public">
              Make this list public
              <span className="help-text">Public lists can be viewed by anyone on your profile.</span>
            </label>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
              {saving ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
