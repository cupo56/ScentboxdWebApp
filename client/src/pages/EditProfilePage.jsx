import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from '../services/profileService';
import { toast } from '../store/toastStore';
import './EditProfilePage.css';

export default function EditProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      return toast.error('Username is required.');
    }

    try {
      setSaving(true);
      await updateProfile({
        username: username.trim(),
        bio: bio.trim(),
      });
      await refreshProfile();
      toast.success('Profile updated successfully!');
      navigate(`/profile/${username.trim()}`);
    } catch (err) {
      toast.error('Failed to update profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    toast.info('Avatar upload requires backend storage setup (Entwickler B).');
  };

  if (!user || !profile) {
    return (
      <div className="spinner-container">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="edit-profile page">
      <div className="container" style={{ maxWidth: '600px' }}>
        <h1 className="section-title">Edit Profile</h1>
        
        <div className="edit-profile__card card">
          <div className="edit-profile__avatar-section">
            <div className="edit-profile__avatar-preview">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" />
              ) : (
                <span>{(username || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            <div className="edit-profile__avatar-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAvatarClick}>
                Change Avatar
              </button>
              <p className="help-text">JPG, GIF or PNG. Max size of 2MB.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="edit-profile__form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                className="input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little about your fragrance journey..."
                rows="4"
              />
            </div>

            <div className="edit-profile__actions">
              <button 
                type="button" 
                className="btn btn-ghost" 
                onClick={() => navigate(`/profile/${profile.username}`)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
