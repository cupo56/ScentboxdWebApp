import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProfileByUsername } from '../services/profileService';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { getUserLists, deleteList } from '../services/listService';
import { toast } from '../store/toastStore';
import PerfumeCard from '../components/perfume/PerfumeCard';
import EditProfileModal from '../components/profile/EditProfileModal';
import ListFormModal from '../components/list/ListFormModal';
import { useAuth } from '../hooks/useAuth';
import './ProfilePage.css';

const TABS = [
  { key: 'owned', field: 'is_owned', label: 'Owned' },
  { key: 'want_to_try', field: 'is_want_to_try', label: 'Want to try' },
  { key: 'favorites', field: 'is_favorite', label: 'Favorites' },
];

export default function ProfilePage() {
  const { username } = useParams();
  const { user, setProfile: setAuthProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({ owned: 0, want_to_try: 0, favorites: 0 });
  const [activeTab, setActiveTab] = useState('owned');
  const [perfumes, setPerfumes] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setActiveTab('owned');
    getProfileByUsername(username)
      .then(async (p) => {
        setProfile(p);
        const [owned, want, fav, listData] = await Promise.all([
          getUserPerfumesByStatus(p.id, 'is_owned'),
          getUserPerfumesByStatus(p.id, 'is_want_to_try'),
          getUserPerfumesByStatus(p.id, 'is_favorite'),
          getUserLists(p.id),
        ]);
        setCounts({ owned: owned.length, want_to_try: want.length, favorites: fav.length });
        setPerfumes(owned.map((d) => d.perfumes).filter(Boolean));
        setLists(listData || []);
      })
      .catch((err) => toast.error('Failed to load profile: ' + err.message))
      .finally(() => setLoading(false));
  }, [username]);

  const loadTab = async (tab) => {
    setActiveTab(tab.key);
    const data = await getUserPerfumesByStatus(profile.id, tab.field);
    setPerfumes(data.map((d) => d.perfumes).filter(Boolean));
  };

  if (loading) return <div className="spinner-container"><div className="spinner spinner-lg" /></div>;
  if (!profile) return <div className="empty-state"><h3>User not found</h3></div>;

  const isOwn = user?.id === profile.id;

  const handleListCreated = (newList) => {
    setLists((prev) => [newList, ...prev]);
    setShowCreateListModal(false);
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this list? This cannot be undone.')) return;
    await deleteList(listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
  };

  const handleProfileSave = (updated) => {
    setProfile(updated);
    setAuthProfile(updated);
    setShowEditModal(false);
    if (updated.username !== username) navigate(`/profile/${updated.username}`, { replace: true });
  };

  return (
    <>
      <div className="shelf">
        <div className="shelf__head">
          <div className="shelf__avatar">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile.username || 'U')[0].toUpperCase()}
          </div>
          <div className="shelf__head-info">
            <h1>{profile.username}</h1>
            {profile.bio && <p>{profile.bio}</p>}
          </div>
          <div className="shelf__head-stats">
            <div><span>{counts.owned}</span><label>Owned</label></div>
            <div><span>{counts.want_to_try}</span><label>Wishlist</label></div>
          </div>
          {isOwn && <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>Edit profile</button>}
        </div>

        <div className="shelf__body">
          <div className="shelf__main">
            <div className="shelf__tabs">
              {TABS.map((tab) => (
                <button key={tab.key} className={activeTab === tab.key ? 'active' : ''} onClick={() => loadTab(tab)}>
                  {tab.label} {counts[tab.key]}
                </button>
              ))}
            </div>
            {perfumes.length > 0 ? (
              <div className="shelf__grid">
                {perfumes.map((p) => <PerfumeCard key={p.id} perfume={p} />)}
              </div>
            ) : (
              <div className="shelf__empty">
                <div className="shelf__empty-outlines">
                  <span /><span /><span />
                </div>
                <div>
                  <div>Nothing here yet</div>
                  {isOwn && <p>Add the bottle you wore today.</p>}
                </div>
              </div>
            )}
          </div>

          <aside className="shelf__lists">
            <div className="shelf__lists-head">
              <span>Lists</span>
              {isOwn && <button onClick={() => setShowCreateListModal(true)}>+ New</button>}
            </div>
            {lists.length > 0 ? lists.map((list) => (
              <div key={list.id} className="shelf__list-row">
                <Link to={`/list/${list.id}`}>
                  <div>{list.name}</div>
                  <div>{list.list_items?.[0]?.count ?? 0} fragrances · {list.is_public ? 'Public' : 'Private'}</div>
                </Link>
                {isOwn && <button onClick={() => handleDeleteList(list.id)}>Delete</button>}
              </div>
            )) : <p className="shelf__empty-lists">No lists yet.</p>}
          </aside>
        </div>
      </div>

      {showEditModal && <EditProfileModal profile={profile} onSave={handleProfileSave} onClose={() => setShowEditModal(false)} />}
      {showCreateListModal && <ListFormModal onSave={handleListCreated} onClose={() => setShowCreateListModal(false)} />}
    </>
  );
}
