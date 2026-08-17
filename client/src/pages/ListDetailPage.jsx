import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getListById, deleteList, removeFromList } from '../services/listService';
import { getProfileById } from '../services/profileService';
import { toast } from '../store/toastStore';
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
        if (data?.user_id) getProfileById(data.user_id).then(setAuthorProfile).catch(() => {});
      })
      .catch((err) => toast.error('Failed to load list details: ' + err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner-container"><div className="spinner spinner-lg" /></div>;
  if (!list) return <div className="empty-state"><h3>List not found</h3></div>;

  const isOwner = user?.id === list.user_id;
  const items = list.list_items || [];

  const handleDelete = async () => {
    if (!window.confirm('Delete this list? This cannot be undone.')) return;
    await deleteList(list.id);
    navigate(`/profile/${authorProfile?.username}`, { replace: true });
  };

  const handleRemovePerfume = async (perfumeId) => {
    await removeFromList(list.id, perfumeId);
    setList((prev) => ({ ...prev, list_items: prev.list_items.filter((item) => item.perfumes?.id !== perfumeId) }));
  };

  return (
    <>
      <div className="list-detail">
        <div className="list-detail__crumb">Shelf › Lists</div>
        <header className="list-detail__header">
          <div>
            <h1>{list.name}</h1>
            {list.description && <p>{list.description}</p>}
            <div className="list-detail__meta">
              {authorProfile?.username && <Link to={`/profile/${authorProfile.username}`}>by {authorProfile.username}</Link>}
              <span>{items.length} fragrances</span>
              <span>{list.is_public ? 'Public' : 'Private'}</span>
            </div>
          </div>
          {isOwner && (
            <div className="list-detail__actions">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>Edit</button>
              <button className="btn btn-ghost" onClick={handleDelete}>Delete</button>
            </div>
          )}
        </header>

        {items.length > 0 ? (
          <div className="list-detail__rows">
            {items.map((item, i) => {
              const perfume = item.perfumes;
              if (!perfume) return null;
              return (
                <div key={item.id} className="list-detail__row">
                  <span className="list-detail__rank">{i + 1}</span>
                  <div className="bottle list-detail__img">
                    {perfume.image_url ? <img src={perfume.image_url} alt="" /> : <span>◆</span>}
                  </div>
                  <div className="list-detail__info">
                    <Link to={`/perfume/${perfume.id}`}>{perfume.name}</Link>
                    <span>{perfume.brands?.name} · {perfume.concentration}</span>
                  </div>
                  <span className="list-detail__score">
                    {perfume.performance != null ? Number(perfume.performance).toFixed(1) : '—'}
                  </span>
                  {isOwner && (
                    <button className="list-detail__remove" onClick={() => handleRemovePerfume(perfume.id)} title="Remove">✕</button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3>This list is empty</h3>
            {isOwner && <p>Browse fragrances and add them to this list.</p>}
          </div>
        )}
      </div>

      {showEditModal && <ListFormModal initialData={list} onSave={(u) => { setList((p) => ({ ...p, ...u })); setShowEditModal(false); }} onClose={() => setShowEditModal(false)} />}
    </>
  );
}
