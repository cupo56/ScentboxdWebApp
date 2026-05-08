import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getListById, deleteList, removeFromList } from '../services/listService';
import { getProfileById } from '../services/profileService';
import { toast } from '../store/toastStore';
import PerfumeGrid from '../components/perfume/PerfumeGrid';
import PerfumeCard from '../components/perfume/PerfumeCard';
import ListFormModal from '../components/list/ListFormModal';
import { useAuth } from '../hooks/useAuth';
import './ListDetailPage.css';

export default function ListDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [authorProfile, setAuthorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    getListById(id)
      .then((data) => {
        setList(data);
        if (data?.user_id) {
          getProfileById(data.user_id).then(setAuthorProfile).catch(() => {});
        }
      })
      .catch((err) => toast.error('Failed to load list details: ' + err.message))
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

  const isOwner = user?.id === list.user_id;
  const items = list.list_items || [];

  const handleDelete = async () => {
    if (!window.confirm('Delete this list? This cannot be undone.')) return;
    try {
      await deleteList(list.id);
      navigate(`/profile/${authorProfile?.username}`, { replace: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemovePerfume = async (perfumeId) => {
    try {
      await removeFromList(list.id, perfumeId);
      setList((prev) => ({
        ...prev,
        list_items: prev.list_items.filter((item) => item.perfumes?.id !== perfumeId),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = (updated) => {
    setList((prev) => ({ ...prev, ...updated }));
    setShowEditModal(false);
  };

  return (
    <>
      <div className="list-detail page">
        <div className="container">
          <header className="list-detail__header">
            <div className="list-detail__title-row">
              <h1 className="list-detail__name">{list.name}</h1>
              {isOwner && (
                <div className="list-detail__owner-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(true)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            {list.description && (
              <p className="list-detail__desc">{list.description}</p>
            )}
            <div className="list-detail__meta">
              {authorProfile?.username && (
                <Link to={`/profile/${authorProfile.username}`} className="list-detail__author">
                  by @{authorProfile.username}
                </Link>
              )}
              <span className="badge badge-accent">
                {items.length} fragrance{items.length !== 1 ? 's' : ''}
              </span>
              <span className="badge badge-accent">
                {list.is_public ? '🌐 Public' : '🔒 Private'}
              </span>
            </div>
          </header>

          {items.length > 0 ? (
            <div className="perfume-grid">
              {items.map((item) => {
                const perfume = item.perfumes;
                if (!perfume) return null;
                return (
                  <div key={item.id} className="list-detail__perfume-wrapper">
                    <PerfumeCard perfume={perfume} />
                    {isOwner && (
                      <button
                        className="list-detail__remove-btn"
                        onClick={() => handleRemovePerfume(perfume.id)}
                        title="Remove from list"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>This list is empty</h3>
              {isOwner && <p>Browse fragrances and add them to this list.</p>}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <ListFormModal
          initialData={list}
          onSave={handleEditSave}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
