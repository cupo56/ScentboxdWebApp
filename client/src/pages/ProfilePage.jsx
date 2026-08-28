import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Flag } from '@phosphor-icons/react';
import { getProfileByUsername } from '../services/profileService';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { getUserLists, deleteList } from '../services/listService';
import { getReviewsByUser, getLikedReviewsByUser, deleteReview } from '../services/reviewService';
import { getFollowCounts } from '../services/followService';
import { isBlocked, blockUser, unblockUser } from '../services/blockService';
import { toast } from '../store/toastStore';
import PerfumeCard from '../components/perfume/PerfumeCard';
import ReviewCard from '../components/review/ReviewCard';
import ListFormModal from '../components/list/ListFormModal';
import FollowButton from '../components/profile/FollowButton';
import FollowListModal from '../components/profile/FollowListModal';
import ReportModal from '../components/report/ReportModal';
import { useAuth } from '../hooks/useAuth';
import './ProfilePage.css';

const TABS = [
  { key: 'owned', field: 'is_owned', label: 'Owned' },
  { key: 'want_to_try', field: 'is_want_to_try', label: 'Want to try' },
  { key: 'favorites', field: 'is_favorite', label: 'Favorites' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'liked', label: 'Liked' },
];

const MEMBER_SINCE_FORMAT = { year: 'numeric', month: 'long' };

export default function ProfilePage() {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [counts, setCounts] = useState({ owned: 0, want_to_try: 0, favorites: 0, reviews: 0, liked: 0 });
  const [activeTab, setActiveTab] = useState('owned');
  const [perfumes, setPerfumes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [likedReviews, setLikedReviews] = useState([]);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [followModalTab, setFollowModalTab] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [reportingProfile, setReportingProfile] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Read the requested tab once at load time (e.g. `?tab=want_to_try` from
    // AccountMenu/AccountPage's "Want to try" link) — not a reactive dep, so
    // navigating with a new ?tab while already on this page won't re-fetch.
    const requestedTab = TABS.find((t) => t.key === searchParams.get('tab')) || TABS[0];
    setActiveTab(requestedTab.key);
    getProfileByUsername(username)
      .then(async (p) => {
        setProfile(p);
        const [owned, want, fav, listData, reviewData, likedData, followData] = await Promise.all([
          getUserPerfumesByStatus(p.id, 'is_owned'),
          getUserPerfumesByStatus(p.id, 'is_want_to_try'),
          getUserPerfumesByStatus(p.id, 'is_favorite'),
          getUserLists(p.id),
          getReviewsByUser(p.id),
          getLikedReviewsByUser(p.id),
          getFollowCounts(p.id),
        ]);
        setCounts({ owned: owned.length, want_to_try: want.length, favorites: fav.length, reviews: reviewData.length, liked: likedData.length });
        const byField = { is_owned: owned, is_want_to_try: want, is_favorite: fav };
        if (requestedTab.field) setPerfumes(byField[requestedTab.field].map((d) => d.perfumes).filter(Boolean));
        setReviews(reviewData);
        setLikedReviews(likedData);
        setFollowCounts(followData);
        setLists(listData || []);
      })
      .catch((err) => toast.error('Failed to load profile: ' + err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    if (!profile || !user || user.id === profile.id) return;
    isBlocked(profile.id).then(setBlocked).catch(() => {});
  }, [profile, user]);

  const handleToggleBlock = async () => {
    try {
      if (blocked) {
        await unblockUser(profile.id);
        setBlocked(false);
        toast.success(`Unblocked ${profile.username}.`);
      } else {
        if (!window.confirm(`Block ${profile.username}? You won't see their reviews in your feeds anymore.`)) return;
        await blockUser(profile.id);
        setBlocked(true);
        toast.success(`Blocked ${profile.username}.`);
      }
    } catch (err) {
      toast.error('Failed to update block status: ' + err.message);
    }
  };

  const loadTab = async (tab) => {
    setActiveTab(tab.key);
    if (!tab.field) return; // reviews tab is already loaded in full on mount
    const data = await getUserPerfumesByStatus(profile.id, tab.field);
    setPerfumes(data.map((d) => d.perfumes).filter(Boolean));
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setCounts((prev) => ({ ...prev, reviews: prev.reviews - 1 }));
    } catch (err) {
      toast.error('Failed to delete review: ' + err.message);
    }
  };

  const handleUpdateReview = (updated) => {
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  };

  const handleDeleteLikedReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setLikedReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      toast.error('Failed to delete review: ' + err.message);
    }
  };

  const handleUpdateLikedReview = (updated) => {
    setLikedReviews((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
  };

  if (loading) {
    return (
      <div className="shelf">
        <div className="shelf__head">
          <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
          <div className="shelf__head-info">
            <div className="skeleton" style={{ height: 22, width: 140 }} />
          </div>
        </div>
        <div className="shelf__body">
          <div className="shelf__main">
            <div className="shelf__grid">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-md)' }} />)}
            </div>
          </div>
          <aside className="shelf__lists">
            <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 40, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 40 }} />
          </aside>
        </div>
      </div>
    );
  }
  if (!profile) return <div className="empty-state"><h3>User not found</h3></div>;

  const isOwn = user?.id === profile.id;
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', MEMBER_SINCE_FORMAT)
    : null;

  const handleListCreated = (newList) => {
    setLists((prev) => [newList, ...prev]);
    setShowCreateListModal(false);
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this list? This cannot be undone.')) return;
    await deleteList(listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
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
            {memberSince && <p className="shelf__member-since">Member since {memberSince}</p>}
            <div className="shelf__follow-counts">
              <button type="button" onClick={() => setFollowModalTab('followers')}>
                <strong>{followCounts.followers}</strong> Followers
              </button>
              <span className="shelf__follow-sep">·</span>
              <button type="button" onClick={() => setFollowModalTab('following')}>
                <strong>{followCounts.following}</strong> Following
              </button>
            </div>
          </div>
          <div className="shelf__head-stats">
            <div><span>{counts.owned}</span><label>Owned</label></div>
            <div><span>{counts.want_to_try}</span><label>Wishlist</label></div>
            <div><span>{counts.reviews}</span><label>Reviews</label></div>
          </div>
          {isOwn ? (
            <Link to="/settings" className="btn btn-secondary">Edit profile</Link>
          ) : (
            <div className="shelf__profile-actions">
              <FollowButton
                targetUserId={profile.id}
                onChange={(nowFollowing) => setFollowCounts((prev) => ({ ...prev, followers: prev.followers + (nowFollowing ? 1 : -1) }))}
              />
              <button type="button" className="btn btn-secondary" onClick={handleToggleBlock}>
                {blocked ? 'Unblock' : 'Block'}
              </button>
              <button type="button" className="shelf__report-btn" onClick={() => setReportingProfile(true)} aria-label="Report this profile">
                <Flag size={16} aria-hidden="true" />
              </button>
            </div>
          )}
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
            {activeTab === 'reviews' ? (
              reviews.length > 0 ? (
                <div className="shelf__reviews">
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} currentUserId={user?.id} onDelete={handleDeleteReview} onUpdate={handleUpdateReview} />
                  ))}
                </div>
              ) : (
                <div className="shelf__empty">
                  <div className="shelf__empty-outlines">
                    <span /><span /><span />
                  </div>
                  <div>
                    <div>No verdicts yet</div>
                    {isOwn && <p>Write one from any fragrance's page.</p>}
                  </div>
                </div>
              )
            ) : activeTab === 'liked' ? (
              likedReviews.length > 0 ? (
                <div className="shelf__reviews">
                  {likedReviews.map((r) => (
                    <ReviewCard key={r.id} review={r} currentUserId={user?.id} onDelete={handleDeleteLikedReview} onUpdate={handleUpdateLikedReview} />
                  ))}
                </div>
              ) : (
                <div className="shelf__empty">
                  <div className="shelf__empty-outlines">
                    <span /><span /><span />
                  </div>
                  <div>
                    <div>No liked verdicts yet</div>
                    {isOwn && <p>Verdicts you like show up here.</p>}
                  </div>
                </div>
              )
            ) : perfumes.length > 0 ? (
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

      {showCreateListModal && <ListFormModal onSave={handleListCreated} onClose={() => setShowCreateListModal(false)} />}
      {followModalTab && (
        <FollowListModal userId={profile.id} initialTab={followModalTab} onClose={() => setFollowModalTab(null)} />
      )}
      {reportingProfile && (
        <ReportModal contentType="profile" reportedUserId={profile.id} onClose={() => setReportingProfile(false)} />
      )}
    </>
  );
}
