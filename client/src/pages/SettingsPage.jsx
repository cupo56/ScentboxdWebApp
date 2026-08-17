import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, uploadAvatar } from '../services/profileService';
import { getNotificationPreferences, updateNotificationPreferences } from '../services/notificationService';
import { supabase } from '../lib/supabaseClient';
import { toast } from '../store/toastStore';
import './SettingsPage.css';

const NOTIF_FIELDS = [
  { key: 'new_reviews', label: 'New reviews', hint: 'On fragrances you own or want.' },
  { key: 'review_likes', label: 'Review likes', hint: 'When someone likes one of your verdicts.' },
  { key: 'new_comments', label: 'Replies to your verdicts', hint: null },
  { key: 'new_followers', label: 'New followers', hint: null },
  { key: 'similar_added', label: 'Similar added', hint: 'New entries close to what you own.' },
  { key: 'community_updates', label: 'Community updates', hint: null },
];

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'privacy', label: 'Shelf & privacy' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'account', label: 'Account' },
];

export default function SettingsPage() {
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeSection, setActiveSection] = useState('profile');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [notifs, setNotifs] = useState(null);
  const [initial, setInitial] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    getNotificationPreferences(user.id).then((prefs) => {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setIsPublic(profile.is_public);
      setNotifs(prefs);
      setInitial({ username: profile.username || '', bio: profile.bio || '', is_public: profile.is_public, ...prefs });
    }).catch((err) => toast.error('Failed to load settings: ' + err.message));
  }, [user, profile]);

  if (!initial || !notifs) {
    return <div className="spinner-container"><div className="spinner spinner-lg" /></div>;
  }

  const dirty = username !== initial.username
    || bio !== initial.bio
    || isPublic !== initial.is_public
    || NOTIF_FIELDS.some((f) => notifs[f.key] !== initial[f.key]);

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const [updatedProfile] = await Promise.all([
        updateProfile({ username: username.trim(), bio: bio.trim(), is_public: isPublic }),
        updateNotificationPreferences(user.id, Object.fromEntries(NOTIF_FIELDS.map((f) => [f.key, notifs[f.key]]))),
      ]);
      setProfile(updatedProfile);
      setInitial({ username: updatedProfile.username || '', bio: updatedProfile.bio || '', is_public: updatedProfile.is_public, ...notifs });
      toast.success('Settings saved.');
      if (updatedProfile.username !== profile.username) {
        navigate(`/settings`, { replace: true });
      }
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setProfile(updated);
      toast.success('Avatar updated.');
    } catch (err) {
      toast.error('Failed to upload avatar: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSendResetLink = async () => {
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent to ' + user.email);
    } catch (err) {
      toast.error('Failed to send reset link: ' + err.message);
    } finally {
      setSendingReset(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("This permanently deletes your account, your shelf, your lists, and your verdicts. This can't be undone. Continue?")) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (err) {
      toast.error('Failed to delete account: ' + err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="settings">
      <div className="settings__header">
        <div>
          <div className="settings__crumb">Shelf › {profile.username}</div>
          <h1 className="settings__title">Settings</h1>
        </div>
        <button
          type="button"
          className={`btn ${dirty ? 'btn-primary' : 'settings__save--disabled'}`}
          disabled={!dirty || saving}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="settings__body">
        <nav className="settings__nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`settings__nav-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="settings__content">
          <section id="profile" className="settings__section">
            <div className="settings__section-label">Profile</div>
            <div className="settings__avatar-row">
              <span className="settings__avatar">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : (username || 'U')[0].toUpperCase()}
              </span>
              <div className="settings__avatar-info">
                <div className="settings__field-title">Avatar</div>
                <div className="settings__field-hint">PNG or JPG, at least 256×256.</div>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" hidden onChange={handleAvatarFile} />
            </div>

            <div className="settings__row-2col">
              <div>
                <label className="settings__label">Handle</label>
                <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} />
              </div>
              <div>
                <label className="settings__label">Email</label>
                <div className="settings__static-field">{user.email}</div>
              </div>
            </div>

            <div>
              <label className="settings__label">Bio</label>
              <textarea className="input" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} maxLength={160} />
              <div className="settings__charcount">{bio.length} / 160</div>
            </div>
          </section>

          <section id="privacy" className="settings__section">
            <div className="settings__section-label">Shelf &amp; privacy</div>
            <div className="settings__toggle-row">
              <div>
                <div className="settings__field-title">Public shelf</div>
                <div className="settings__field-hint">Anyone can see what you own and how often you wear it.</div>
              </div>
              <button
                type="button"
                className={`settings__switch ${isPublic ? 'on' : ''}`}
                role="switch"
                aria-checked={isPublic}
                aria-label="Public shelf"
                onClick={() => setIsPublic((v) => !v)}
              >
                <span />
              </button>
            </div>
          </section>

          <section id="notifications" className="settings__section">
            <div className="settings__section-label">Notifications</div>
            {NOTIF_FIELDS.map((f) => (
              <div key={f.key} className="settings__toggle-row">
                <div>
                  <div className="settings__field-title">{f.label}</div>
                  {f.hint && <div className="settings__field-hint">{f.hint}</div>}
                </div>
                <button
                  type="button"
                  className={`settings__switch ${notifs[f.key] ? 'on' : ''}`}
                  role="switch"
                  aria-checked={notifs[f.key]}
                  aria-label={f.label}
                  onClick={() => setNotifs((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
                >
                  <span />
                </button>
              </div>
            ))}
          </section>

          <section id="account" className="settings__section">
            <div className="settings__section-label">Account</div>
            <div className="settings__toggle-row">
              <div className="settings__field-title">Change password</div>
              <button type="button" className="btn btn-secondary" onClick={handleSendResetLink} disabled={sendingReset}>
                {sendingReset ? 'Sending…' : 'Send link'}
              </button>
            </div>
            <div className="settings__toggle-row settings__toggle-row--danger">
              <div>
                <div className="settings__field-title settings__field-title--accent">Delete account</div>
                <div className="settings__field-hint">This permanently deletes your account, your shelf, your lists, and your verdicts.</div>
              </div>
              <button type="button" className="btn settings__delete-btn" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
