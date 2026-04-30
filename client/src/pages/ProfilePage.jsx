import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProfileByUsername } from '../services/profileService';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { getUserLists } from '../services/listService';
import { toast } from '../store/toastStore';
import PerfumeCard from '../components/perfume/PerfumeCard';
import { useAuth } from '../hooks/useAuth';
import './ProfilePage.css';

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('favorites');
  const [perfumes, setPerfumes] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProfileByUsername(username)
      .then((p) => {
        setProfile(p);
        return p;
      })
      .then((p) => loadTab('favorites', p.id))
      .catch((err) => toast.error('Failed to load profile: ' + err.message))
      .finally(() => setLoading(false));
  }, [username]);

  const loadTab = async (tab, userId) => {
    setActiveTab(tab);
    const uid = userId || profile?.id;
    if (!uid) return;

    if (tab === 'lists') {
      const data = await getUserLists(uid);
      setLists(data || []);
      setPerfumes([]);
    } else {
      const fieldMap = {
        favorites: 'is_favorite',
        owned: 'is_owned',
        want_to_try: 'is_want_to_try',
      };
      const data = await getUserPerfumesByStatus(uid, fieldMap[tab]);
      setPerfumes(data?.map((d) => d.perfumes).filter(Boolean) || []);
      setLists([]);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h3>User not found</h3>
        </div>
      </div>
    );
  }

  const isOwn = user?.id === profile.id;
  const tabs = [
    { key: 'favorites', label: '❤️ Favorites' },
    { key: 'owned', label: '📦 Collection' },
    { key: 'want_to_try', label: '🧪 Want to Try' },
    { key: 'lists', label: '📋 Lists' },
  ];

  return (
    <div className="profile-page page">
      <div className="container">
        {/* Header */}
        <div className="profile-page__header">
          <div className="profile-page__avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} />
            ) : (
              <span>{(profile.username || 'U')[0].toUpperCase()}</span>
            )}
          </div>
          <div className="profile-page__info">
            <h1 className="profile-page__username">@{profile.username}</h1>
            {profile.bio && <p className="profile-page__bio">{profile.bio}</p>}
            <p className="profile-page__joined">
              Joined {new Date(profile.created_at || profile.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-page__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`profile-page__tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => loadTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="profile-page__content">
          {activeTab !== 'lists' && perfumes.length > 0 && (
            <div className="perfume-grid">
              {perfumes.map((p) => (
                <PerfumeCard key={p.id} perfume={p} />
              ))}
            </div>
          )}

          {activeTab !== 'lists' && perfumes.length === 0 && (
            <div className="empty-state">
              <div className="icon">📭</div>
              <h3>No fragrances here yet</h3>
            </div>
          )}

          {activeTab === 'lists' && lists.length > 0 && (
            <div className="profile-page__lists">
              {lists.map((list) => (
                <Link key={list.id} to={`/list/${list.id}`} className="profile-page__list-card card">
                  <h3>{list.name}</h3>
                  {list.description && <p>{list.description}</p>}
                  <span className="profile-page__list-meta">
                    {list.is_public ? '🌐 Public' : '🔒 Private'}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'lists' && lists.length === 0 && (
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>No lists yet</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
