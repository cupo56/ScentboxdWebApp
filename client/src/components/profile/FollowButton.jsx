import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isFollowing, followUser, unfollowUser } from '../../services/followService';
import { toast } from '../../store/toastStore';

export default function FollowButton({ targetUserId, onChange }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !targetUserId) return;
    isFollowing(targetUserId).then(setFollowing);
  }, [isAuthenticated, targetUserId]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (loading) return;
    setLoading(true);
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    try {
      if (wasFollowing) await unfollowUser(targetUserId);
      else await followUser(targetUserId);
      onChange?.(!wasFollowing);
    } catch (err) {
      setFollowing(wasFollowing);
      toast.error('Failed to update follow status: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      className={`btn ${following ? 'btn-secondary' : 'btn-primary'}`}
      onClick={handleClick}
      disabled={loading}
      aria-pressed={following}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
