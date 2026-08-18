# Account Menu, Settings, and Mobile Account Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the "Account" area to the already-shipped Sillage redesign — a desktop avatar dropdown (AccountMenu), a full `/settings` page (profile editing, shelf privacy, notification preferences, account actions), and a mobile `/account` page reachable from a new "You" tab-bar slot that replaces "Houses" on mobile — per the second design handoff round (`/Users/cupo/Downloads/design_handoff_scentboxd_redesign 2/`, screens 5a/5b/5c).

**Architecture:** Same pattern as the rest of the app — pages under `client/src/pages`, components under `client/src/components`, data via `client/src/services`. Two new service files (`notificationService.js`, plus additions to `profileService.js`), one new layout component (`AccountMenu.jsx`), two new pages (`SettingsPage.jsx`, `AccountPage.jsx`), and a `TabBar.jsx` update. Retires two already-dead files (`EditProfileModal.jsx`, `EditProfilePage.jsx` — confirmed unreachable/broken before this plan; superseded by `/settings`).

**Tech Stack:** Same as the rest of the app (React 19, React Router v7, Zustand, Supabase). Reuses the existing `avatars` Supabase Storage bucket (already provisioned, public) and the existing `delete-account` Supabase Edge Function (already deployed, `verify_jwt: true`, does a full cascading delete via `auth.admin.deleteUser` — see Scope Decision #3 below for why the mockup's "credited to a deleted user" copy is corrected).

**No test suite exists in this repo.** Every task's verify step is `npm run lint` + `npm run build`, same as the rest of this project's plans. **Lint baseline going in: 6 problems (6 errors, 0 warnings)** — the same pre-existing `react-hooks/set-state-in-effect` pattern in `Navbar.jsx`, `BrandPage.jsx`, `ExplorePage.jsx`, `HomePage.jsx`, `PerfumeDetailPage.jsx`, `ProfilePage.jsx`. None of these files are rewritten from scratch by this plan (only `Navbar.jsx` is modified, not fully rewritten), so expect this baseline to hold steady at 6 unless a task's own verify step says otherwise.

---

## Scope & Data Decisions

The mockup (5a/5b/5c) was designed without checking what data actually exists. This app shares its Supabase backend with a native iOS app, which already has richer, differently-shaped tables than the mockup assumed. Investigated live against the database before writing this plan:

1. **"Public shelf" maps to the real `profiles.is_public` column** (boolean, default `true`, already exists and already used nowhere in the current UI — this plan is what finally wires it up). Not a new column.
2. **"Show wishlist" and "Default list visibility" toggles are dropped entirely.** No column for either concept exists anywhere in the schema (checked `profiles`, `lists`, and every other table) and the user explicitly decided not to invent new columns for a design-only concept when the goal is parity with what the iOS app already uses. The Settings page's "Shelf & privacy" section therefore has exactly one toggle (Public shelf), not three.
3. **"Delete account" copy is corrected from the mockup.** The mockup says "Your verdicts stay, credited to a deleted user." The actual, already-deployed `delete-account` Edge Function does a full cascading delete through `auth.admin.deleteUser()` — profiles, reviews, review_likes, follows, comments, user_perfumes, device_tokens, notification_preferences, notifications, wear_logs, and lists are **all** deleted, nothing is anonymized/kept. Shipping the mockup's copy would be a factually false claim to a user about to make an irreversible decision. The real copy used in this plan: "This permanently deletes your account, your shelf, your lists, and your verdicts. This can't be undone."
4. **Notifications section shows the real 6-column `notification_preferences` table**, not the mockup's simplified 2-toggle version (which don't map to real concepts — there's no "weekly digest" cron/email infrastructure anywhere in this project). Real columns, all boolean, all default `true` except `similar_added`/`community_updates` which default `false`: `new_reviews`, `review_likes`, `new_comments` (closest real match to the mockup's "Replies to your verdicts"), `new_followers`, `similar_added`, `community_updates`. User explicitly chose full parity with the real table over the mockup's simplified pair.
5. **"Appearance: Dark" is rendered as static, non-interactive text**, not a toggle. No light theme exists anywhere in this design system (Sillage is dark-only by design, per the original redesign's own token set) — a toggle that does nothing on click would be worse than an honest static label. Matches this project's established pattern (e.g. "Weekly shelf digest" and similar mockup elements with no backing feature get dropped or de-fanged, not faked).
6. **Avatar upload is real**, not stubbed. The `avatars` Supabase Storage bucket already exists (public, already used by the `delete-account` function's cleanup step, which expects avatars at `{userId.toLowerCase()}.jpg`) — this plan's upload function writes to that same path convention so the existing delete-account cleanup continues to work correctly.
7. **"Change password" reuses the existing `supabase.auth.resetPasswordForEmail` flow**, the exact same call `ForgotPasswordPage.jsx` already makes — just triggered from Settings instead of a public form, using the signed-in user's own email (no email input needed, it's already known).
8. **EditProfileModal.jsx and EditProfilePage.jsx are retired.** `EditProfilePage.jsx` was already confirmed dead/unreachable code before this plan (calls a `refreshProfile()` function that doesn't exist on `useAuth()`, and its route was never linked from anywhere in the current UI apart from itself). `EditProfileModal.jsx` is currently the only way to edit a profile (opened from the Shelf page's "Edit profile" button) — this plan replaces that button's behavior to navigate to `/settings` instead, making the modal redundant. Both files, their CSS, and the modal's import in `ProfilePage.jsx` are deleted. The `/profile/edit` route and its `EditProfilePage` import in `App.jsx` are removed.
9. **Save behavior matches the mockup exactly:** all of Settings' Profile fields (handle, bio) and toggles (Public shelf, all 6 notification prefs) are staged in local component state and committed together in one `Promise.all` when "Save changes" is clicked — the button is disabled until something differs from what was loaded. **Avatar upload is the one exception** — it uploads and saves immediately on file selection (the mockup's own "Upload" button has no separate save step, and staging a file selection across an unrelated save gate would be needless complexity for zero UX benefit).
10. **Settings' left section nav is anchor-link navigation** (click "Notifications" → smooth-scrolls to that section, updates active-state locally), not a scroll-spy that tracks scroll position. All four sections render stacked on one page (matches the mockup's actual DOM structure — it's one scrollable page, not four separate views). This is a deliberate, minor scope simplification: a full scroll-spy would need an `IntersectionObserver` for essentially no user-visible benefit over click-to-scroll on a page this short.
11. **AccountMenu's counts (owned/lists/verdicts/want-to-try) are fetched lazily when the menu opens**, not on every page load — reuses the exact same service calls the Shelf page and Home Feed already use (`getUserPerfumesByStatus`, `getUserLists`, `getReviewCountByUser`), so no new query shapes are introduced.
12. **Mobile "Houses" is dropped from the tab bar in favor of "You"**, per explicit user confirmation — Houses remains reachable on desktop's segment nav; it has no mobile tab-bar entry point after this plan. This was a deliberate design decision in the handoff, not an oversight.

---

## Task 1: Services — notification preferences, profile extensions, avatar upload; AccountMenu component

**Files:**
- Create: `client/src/services/notificationService.js`
- Modify: `client/src/services/profileService.js` (extend `updateProfile`, add `uploadAvatar`)
- Create: `client/src/components/layout/AccountMenu.jsx`
- Create: `client/src/components/layout/AccountMenu.css`
- Modify: `client/src/components/layout/Navbar.jsx` (swap the avatar `Link` + separate "Sign out" button for `<AccountMenu />`)
- Modify: `client/src/components/layout/Navbar.css` (remove now-unused `.navbar__user` rules, `AccountMenu.css` owns the dropdown)

- [ ] **Step 1: Create `notificationService.js`**

```js
import { supabase } from '../lib/supabaseClient';

const DEFAULTS = {
  new_reviews: true,
  review_likes: true,
  new_comments: true,
  new_followers: true,
  similar_added: false,
  community_updates: false,
};

/**
 * Get the current user's notification preferences.
 * Returns defaults if no row exists yet (table starts empty per-user).
 */
export async function getNotificationPreferences(userId) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? { ...DEFAULTS, ...data } : { ...DEFAULTS, user_id: userId };
}

/**
 * Upsert the current user's notification preferences.
 */
export async function updateNotificationPreferences(userId, updates) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: Extend `profileService.js`**

Read the current file first. Modify `updateProfile` to also accept `is_public`, and add a new `uploadAvatar` function right after it:

```js
export async function updateProfile({ username, bio, avatar_url, is_public }) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const updates = {};
  if (username !== undefined) updates.username = username;
  if (bio !== undefined) updates.bio = bio;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  if (is_public !== undefined) updates.is_public = is_public;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Upload a new avatar image and update the profile's avatar_url.
 * Path matches what the delete-account Edge Function expects to clean up:
 * `{userId (lowercase)}.jpg`.
 */
export async function uploadAvatar(file) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('Not authenticated');

  const path = `${user.id.toLowerCase()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust so the new image actually shows (same path is reused every upload).
  const bustedUrl = `${publicUrl}?t=${Date.now()}`;

  return updateProfile({ avatar_url: bustedUrl });
}
```

(`updateProfile`'s existing `username`/`bio`/`avatar_url` handling and the rest of the file stay exactly as-is — only the `is_public` param and the new `uploadAvatar` export are additions.)

- [ ] **Step 3: Create `AccountMenu.jsx`**

```jsx
import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserPerfumesByStatus } from '../../services/userPerfumeService';
import { getUserLists } from '../../services/listService';
import { getReviewCountByUser } from '../../services/reviewService';
import './AccountMenu.css';

export default function AccountMenu() {
  const { profile, user, logout, shelfPath } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ owned: 0, lists: 0, verdicts: 0, want: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open || !user) return;
    Promise.all([
      getUserPerfumesByStatus(user.id, 'is_owned'),
      getUserPerfumesByStatus(user.id, 'is_want_to_try'),
      getUserLists(user.id),
      getReviewCountByUser(user.id),
    ]).then(([owned, want, lists, verdicts]) => {
      setCounts({ owned: owned.length, want: want.length, lists: (lists || []).length, verdicts });
    }).catch(() => {});
  }, [open, user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const handleKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className={`account-menu__trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" />
        ) : (
          (profile?.username || 'U')[0].toUpperCase()
        )}
      </button>

      {open && (
        <div className="account-menu__panel">
          <div className="account-menu__head">
            <span className="account-menu__head-avatar">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile?.username || 'U')[0].toUpperCase()}
            </span>
            <div>
              <div className="account-menu__handle">{profile?.username}</div>
              <div className="account-menu__meta">{counts.owned} owned · {counts.verdicts} verdicts</div>
            </div>
          </div>

          <div className="account-menu__group">
            <NavLink to={shelfPath} className="account-menu__item" onClick={() => setOpen(false)}>
              Your shelf
            </NavLink>
            <NavLink to={shelfPath} className="account-menu__item" onClick={() => setOpen(false)}>
              Your lists <span>{counts.lists}</span>
            </NavLink>
            <NavLink to={shelfPath} className="account-menu__item" onClick={() => setOpen(false)}>
              Your verdicts <span>{counts.verdicts}</span>
            </NavLink>
            <NavLink to={shelfPath} className="account-menu__item" onClick={() => setOpen(false)}>
              Want to try <span>{counts.want}</span>
            </NavLink>
          </div>

          <div className="account-menu__group">
            <NavLink to="/settings" className="account-menu__item" onClick={() => setOpen(false)}>
              Settings
            </NavLink>
            <span className="account-menu__item account-menu__item--static">
              Appearance <span>Dark</span>
            </span>
          </div>

          <div className="account-menu__group">
            <button type="button" className="account-menu__item account-menu__item--danger" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `AccountMenu.css`**

```css
.account-menu { position: relative; }

.account-menu__trigger {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--accent-tint);
  border: 1px solid var(--accent-line);
  color: var(--accent-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font: var(--weight-label) 13px var(--font);
  overflow: hidden;
  cursor: pointer;
  padding: 0;
}
.account-menu__trigger.active { border-color: var(--accent); }
.account-menu__trigger img { width: 100%; height: 100%; object-fit: cover; }

.account-menu__panel {
  position: absolute;
  top: calc(100% + var(--space-6));
  right: 0;
  width: 272px;
  background: var(--surface);
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 200;
}

.account-menu__head {
  padding: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  border-bottom: 1px solid var(--hairline);
}
.account-menu__head-avatar {
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: 50%;
  background: var(--accent-tint);
  border: 1px solid var(--accent-line);
  color: var(--accent-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font: var(--weight-label) 15px var(--font);
  overflow: hidden;
}
.account-menu__head-avatar img { width: 100%; height: 100%; object-fit: cover; }
.account-menu__handle { font: var(--weight-label) 14.5px var(--font); color: var(--text); }
.account-menu__meta { font: var(--weight-body) 12px var(--font); color: var(--text-dim); margin-top: 3px; }

.account-menu__group { padding: var(--space-2); display: flex; flex-direction: column; }
.account-menu__group + .account-menu__group { border-top: 1px solid var(--hairline); }

.account-menu__item {
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  font: var(--weight-body) 13.5px var(--font);
  color: var(--text-body);
  text-decoration: none;
  cursor: pointer;
  text-align: left;
  width: 100%;
}
.account-menu__item span { margin-left: auto; font-size: 12px; color: var(--text-dim); }
.account-menu__item.active { background: var(--accent-tint); color: var(--accent-text); font-weight: var(--weight-label); }
.account-menu__item--static { cursor: default; color: var(--text-body); }
.account-menu__item--danger { color: var(--text-muted); }
```

- [ ] **Step 5: Wire `AccountMenu` into `Navbar.jsx`**

Read the current file first. Replace the `isAuthenticated ? (<div className="navbar__user">...</div>) : (...)` block with:

```jsx
          {isAuthenticated ? (
            <AccountMenu />
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">Sign in</NavLink>
          )}
```

Add the import: `import AccountMenu from './AccountMenu';`. Remove the now-unused `handleLogout` function from `Navbar.jsx` (that logic moved into `AccountMenu.jsx`) — but keep everything else in the file (search panel, segment nav, logo) completely untouched.

- [ ] **Step 6: Clean up `Navbar.css`**

Read the current file first, then delete the now-orphaned `.navbar__user`, `.navbar__avatar`, `.navbar__avatar img` rules (their job is now done by `AccountMenu.css`) — grep first to confirm nothing else in the codebase references `.navbar__avatar`/`.navbar__user` before deleting.

- [ ] **Step 7: Lint + build**

```bash
npm run lint
npm run build
```
Build must fully succeed. Lint should stay at the 6-problem baseline (`Navbar.jsx` is modified, not rewritten, so its existing baseline entry may shift line number — that's fine, just confirm no new *files* show up in the lint output).

- [ ] **Step 8: Commit**

```bash
git add client/src/services/notificationService.js client/src/services/profileService.js client/src/components/layout/AccountMenu.jsx client/src/components/layout/AccountMenu.css client/src/components/layout/Navbar.jsx client/src/components/layout/Navbar.css
git commit -m "feat: add AccountMenu dropdown and notification/avatar services"
```

---

## Task 2: Settings page

**Files:**
- Create: `client/src/pages/SettingsPage.jsx`
- Create: `client/src/pages/SettingsPage.css`
- Modify: `client/src/App.jsx` (add `/settings` route, remove `/profile/edit` + `EditProfilePage` import)
- Modify: `client/src/pages/ProfilePage.jsx` (retarget "Edit profile" button to `/settings`, remove `EditProfileModal` usage)
- Delete: `client/src/components/profile/EditProfileModal.jsx`
- Delete: `client/src/components/profile/EditProfileModal.css`
- Delete: `client/src/pages/EditProfilePage.jsx`
- Delete: `client/src/pages/EditProfilePage.css`

- [ ] **Step 1: Create `SettingsPage.jsx`**

```jsx
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
```

- [ ] **Step 2: Create `SettingsPage.css`**

```css
.settings { max-width: var(--max-width); margin: 0 auto; }

.settings__header {
  display: flex;
  align-items: flex-end;
  gap: var(--space-8);
  padding: var(--space-10) var(--space-14) var(--space-8);
  border-bottom: 1px solid var(--hairline);
}
.settings__crumb { font: var(--weight-body) 13px var(--font); color: var(--text-dim); margin-bottom: var(--space-2); }
.settings__title { font: var(--weight-heading) 30px var(--font); letter-spacing: -0.02em; color: var(--text); }
.settings__save--disabled {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  color: #5f6376;
  font: var(--weight-label) 14px var(--font);
  background: transparent;
  cursor: not-allowed;
}
.settings__header .btn-primary { margin-left: auto; }

.settings__body { display: grid; grid-template-columns: 220px 1fr; }

.settings__nav { padding: var(--space-10) var(--space-8); border-right: 1px solid var(--hairline); display: flex; flex-direction: column; gap: 2px; align-self: start; position: sticky; top: var(--nav-height); }
.settings__nav-item {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-left: 2px solid transparent;
  border-top: none; border-right: none; border-bottom: none;
  background: transparent;
  font: var(--weight-body) 14px var(--font);
  color: var(--text-muted);
  cursor: pointer;
}
.settings__nav-item.active { border-left-color: var(--accent); color: var(--accent-text); }

.settings__content { padding: var(--space-10) var(--space-14) var(--space-14); max-width: 720px; display: flex; flex-direction: column; gap: var(--space-10); }

.settings__section-label { font: var(--weight-label) 11.5px var(--font); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-dim); margin-bottom: var(--space-6); }

.settings__avatar-row { display: flex; align-items: center; gap: var(--space-6); padding-bottom: var(--space-8); border-bottom: 1px solid var(--hairline); }
.settings__avatar {
  width: 64px; height: 64px; flex: none; border-radius: 50%;
  background: var(--accent-tint); border: 1px solid var(--accent-line); color: var(--accent-text);
  display: flex; align-items: center; justify-content: center; font: var(--weight-heading) 24px var(--font); overflow: hidden;
}
.settings__avatar img { width: 100%; height: 100%; object-fit: cover; }
.settings__avatar-info { flex: 1; }
.settings__field-title { font: var(--weight-label) 14px var(--font); color: var(--text); }
.settings__field-title--accent { color: var(--accent-text); }
.settings__field-hint { font: var(--weight-body) 12.5px var(--font); color: var(--text-dim); margin-top: var(--space-1); }

.settings__row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-8); margin-top: var(--space-8); }
.settings__label { display: block; font: var(--weight-body) 12.5px var(--font); color: var(--text-muted); margin-bottom: var(--space-2); }
.settings__static-field { min-height: 44px; display: flex; align-items: center; padding: 0 var(--space-4); border: 1px solid var(--hairline); border-radius: var(--radius-md); background: var(--surface); color: var(--text); font: var(--weight-body) 14px var(--font); }

.settings__content textarea.input { min-height: 76px; margin-top: 0; }
.settings__charcount { font: var(--weight-body) 11.5px var(--font); color: var(--text-dim); margin-top: var(--space-2); }
.settings__content > section > div:has(> label) { margin-top: var(--space-6); }

.settings__toggle-row { display: flex; align-items: center; gap: var(--space-8); padding: var(--space-6) 0; border-top: 1px solid var(--hairline); }
.settings__toggle-row:last-child { border-bottom: 1px solid var(--hairline); }
.settings__toggle-row > div:first-child { flex: 1; }
.settings__toggle-row--danger { align-items: flex-start; }

.settings__switch {
  width: 44px; height: 24px; flex: none;
  border-radius: var(--radius-pill);
  background: var(--surface);
  border: 1px solid var(--hairline-strong);
  position: relative;
  cursor: pointer;
  padding: 0;
}
.settings__switch span {
  position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #5f6376;
  transition: left 0.2s ease, right 0.2s ease;
}
.settings__switch.on { background: var(--accent-tint); border-color: var(--accent); }
.settings__switch.on span { left: auto; right: 3px; background: var(--accent-text); }

.settings__delete-btn { border: 1px solid var(--accent-line); color: var(--accent-text); }

@media (max-width: 900px) {
  .settings__header { padding: var(--space-6); flex-wrap: wrap; }
  .settings__body { grid-template-columns: 1fr; }
  .settings__nav { display: none; }
  .settings__content { padding: var(--space-6); }
  .settings__row-2col { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: Wire the route in `App.jsx`**

Read the current file first. Add `import SettingsPage from './pages/SettingsPage';` (remove `import EditProfilePage from './pages/EditProfilePage';`), replace the `/profile/edit` route with:

```jsx
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
```

(placed in the same position the old `/profile/edit` route occupied). Nothing else in `App.jsx` changes.

- [ ] **Step 4: Retarget `ProfilePage.jsx`'s "Edit profile" button**

Read the current file first. Change the `isOwn && <button ... onClick={() => setShowEditModal(true)}>Edit profile</button>` line to a `Link`:

```jsx
{isOwn && <Link to="/settings" className="btn btn-secondary">Edit profile</Link>}
```

Remove: the `import EditProfileModal from '../components/profile/EditProfileModal';` line, the `const [showEditModal, setShowEditModal] = useState(false);` line, the `handleProfileSave` function (was only used by the modal — confirm nothing else in the file calls it before removing), and the `{showEditModal && <EditProfileModal .../>}` block at the bottom of the JSX. `Link` is already imported from `react-router-dom` in this file (used elsewhere) — confirm before assuming, add it to the import if not.

- [ ] **Step 5: Delete the retired files**

```bash
rm client/src/components/profile/EditProfileModal.jsx client/src/components/profile/EditProfileModal.css client/src/pages/EditProfilePage.jsx client/src/pages/EditProfilePage.css
```

- [ ] **Step 6: Grep for any other references to the deleted files/route before finalizing**

```bash
cd client && grep -rn "EditProfileModal\|EditProfilePage\|profile/edit" src/
```
Expected: no matches.

- [ ] **Step 7: Lint + build**

```bash
npm run lint
npm run build
```
Build must fully succeed. Lint should stay at the 6-problem baseline (`ProfilePage.jsx` is modified, not rewritten — its existing baseline entry may shift line number, that's fine).

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/SettingsPage.jsx client/src/pages/SettingsPage.css client/src/App.jsx client/src/pages/ProfilePage.jsx client/src/components/profile/EditProfileModal.jsx client/src/components/profile/EditProfileModal.css client/src/pages/EditProfilePage.jsx client/src/pages/EditProfilePage.css
git commit -m "feat: add Settings page, retire EditProfileModal/EditProfilePage"
```

---

## Task 3: Mobile Account page + TabBar restructure

**Files:**
- Create: `client/src/pages/AccountPage.jsx`
- Create: `client/src/pages/AccountPage.css`
- Modify: `client/src/App.jsx` (add `/account` route)
- Modify: `client/src/components/layout/TabBar.jsx` (replace "Houses" with "You")
- Modify: `client/src/components/layout/TabBar.css` (style the new avatar-circle tab item)

- [ ] **Step 1: Create `AccountPage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserPerfumesByStatus } from '../services/userPerfumeService';
import { getUserLists } from '../services/listService';
import { getReviewCountByUser } from '../services/reviewService';
import { updateProfile } from '../services/profileService';
import { toast } from '../store/toastStore';
import './AccountPage.css';

export default function AccountPage() {
  const { user, profile, logout, shelfPath, setProfile } = useAuth();
  const [counts, setCounts] = useState({ owned: 0, want: 0, lists: 0, verdicts: 0 });
  const [togglingPublic, setTogglingPublic] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserPerfumesByStatus(user.id, 'is_owned'),
      getUserPerfumesByStatus(user.id, 'is_want_to_try'),
      getUserLists(user.id),
      getReviewCountByUser(user.id),
    ]).then(([owned, want, lists, verdicts]) => {
      setCounts({ owned: owned.length, want: want.length, lists: (lists || []).length, verdicts });
    }).catch(() => {});
  }, [user]);

  if (!profile) return <div className="spinner-container"><div className="spinner spinner-lg" /></div>;

  const handleTogglePublic = async () => {
    setTogglingPublic(true);
    try {
      const updated = await updateProfile({ is_public: !profile.is_public });
      setProfile(updated);
    } catch (err) {
      toast.error('Failed to update: ' + err.message);
    } finally {
      setTogglingPublic(false);
    }
  };

  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="account-page">
      <div className="account-page__head">
        <span className="account-page__avatar">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile.username || 'U')[0].toUpperCase()}
        </span>
        <div className="account-page__head-info">
          <div className="account-page__handle">{profile.username}</div>
          {joined && <div className="account-page__joined">Joined {joined}</div>}
        </div>
        <Link to="/settings" className="btn btn-secondary btn-sm">Edit</Link>
      </div>

      <div className="account-page__stats">
        <div><span>{counts.owned}</span><label>Owned</label></div>
        <div><span>{counts.want}</span><label>Wishlist</label></div>
        <div><span>{counts.verdicts}</span><label>Verdicts</label></div>
      </div>

      <div className="account-page__list">
        <Link to={shelfPath} className="account-page__row">Your shelf <span>{counts.owned} ›</span></Link>
        <Link to={shelfPath} className="account-page__row">Your lists <span>{counts.lists} ›</span></Link>
        <Link to={shelfPath} className="account-page__row">Your verdicts <span>{counts.verdicts} ›</span></Link>
        <Link to={shelfPath} className="account-page__row">Want to try <span>{counts.want} ›</span></Link>
      </div>

      <div className="account-page__list">
        <div className="account-page__section-label">Account</div>
        <Link to="/settings" className="account-page__row">Settings <span>›</span></Link>
        <button type="button" className="account-page__row account-page__row--toggle" onClick={handleTogglePublic} disabled={togglingPublic}>
          Public shelf <span>{profile.is_public ? 'On' : 'Off'}</span>
        </button>
        <button type="button" className="account-page__row account-page__row--muted" onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `AccountPage.css`**

```css
.account-page { padding-bottom: var(--space-10); }

.account-page__head { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-6); border-bottom: 1px solid var(--hairline); }
.account-page__avatar {
  width: 56px; height: 56px; flex: none; border-radius: 50%;
  background: var(--accent-tint); border: 1px solid var(--accent-line); color: var(--accent-text);
  display: flex; align-items: center; justify-content: center; font: var(--weight-heading) 20px var(--font); overflow: hidden;
}
.account-page__avatar img { width: 100%; height: 100%; object-fit: cover; }
.account-page__head-info { flex: 1; }
.account-page__handle { font: var(--weight-heading) 20px var(--font); color: var(--text); }
.account-page__joined { font: var(--weight-body) 12.5px var(--font); color: var(--text-dim); margin-top: 3px; }

.account-page__stats { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid var(--hairline); }
.account-page__stats div { padding: var(--space-6); text-align: center; border-right: 1px solid var(--hairline); }
.account-page__stats div:last-child { border-right: none; }
.account-page__stats span { display: block; font: var(--weight-heading) 20px var(--font); color: var(--text); font-variant-numeric: tabular-nums; }
.account-page__stats label { font: var(--weight-body) 10.5px var(--font); letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); margin-top: 3px; }

.account-page__list { padding: var(--space-8) var(--space-6) 0; display: flex; flex-direction: column; }
.account-page__section-label { font: var(--weight-label) 11.5px var(--font); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-dim); margin-bottom: var(--space-2); }

.account-page__row {
  min-height: 52px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--hairline);
  font: var(--weight-body) 15px var(--font);
  color: var(--text);
  text-decoration: none;
  background: none;
  border-left: none; border-right: none; border-top: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}
.account-page__row span { margin-left: auto; font: var(--weight-body) 13px var(--font); color: var(--text-dim); }
.account-page__row--toggle span { color: var(--accent-text); }
.account-page__row--muted { color: var(--text-muted); }
```

- [ ] **Step 3: Wire the route in `App.jsx`**

Add `import AccountPage from './pages/AccountPage';` and, alongside the `/settings` route added in Task 2:

```jsx
          <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
```

- [ ] **Step 4: Update `TabBar.jsx`** — replace the "Houses" slot with "You"

```jsx
import { NavLink } from 'react-router-dom';
import { Compass, Plus, Rows, SquaresFour } from '@phosphor-icons/react';
import { useAuth } from '../../hooks/useAuth';
import './TabBar.css';

export default function TabBar() {
  const { shelfPath, profile } = useAuth();

  return (
    <nav className="tabbar" aria-label="Main navigation">
      <NavLink to="/" end className="tabbar__item">
        <Rows size={18} aria-hidden="true" />
        <span>Feed</span>
      </NavLink>
      <NavLink to="/explore" className="tabbar__item">
        <Compass size={18} aria-hidden="true" />
        <span>Index</span>
      </NavLink>
      <NavLink to="/explore" className="tabbar__compose" aria-label="Write a verdict">
        <Plus size={20} weight="bold" aria-hidden="true" />
      </NavLink>
      <NavLink to={shelfPath} className="tabbar__item">
        <SquaresFour size={18} aria-hidden="true" />
        <span>Shelf</span>
      </NavLink>
      <NavLink to="/account" className="tabbar__item tabbar__item--you">
        <span className="tabbar__you-avatar">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : (profile?.username || 'U')[0].toUpperCase()}
        </span>
        <span>You</span>
      </NavLink>
    </nav>
  );
}
```

(`House` — used for the old "Houses" slot — is dropped from the import list entirely since nothing references it anymore; `SquaresFour` for Shelf is unchanged from the pre-existing `TabBar.jsx`.)

- [ ] **Step 5: Update `TabBar.css`** — style `.tabbar__you-avatar`

Read the current file first, then add (near the other `.tabbar__*` rules):

```css
.tabbar__you-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--accent-tint);
  border: 1px solid var(--hairline-strong);
  color: var(--text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10.5px;
  font-weight: var(--weight-label);
  overflow: hidden;
}
.tabbar__you-avatar img { width: 100%; height: 100%; object-fit: cover; }
.tabbar__item--you.active .tabbar__you-avatar { border-color: var(--accent); color: var(--accent-text); }
```

- [ ] **Step 6: Visual check** — run `npm run dev` from `client/`, resize to ≤900px (or DevTools device toolbar). Confirm the tab bar shows Feed · Index · + · Shelf · You (no Houses), tapping "You" opens `/account`, the avatar-in-tab-bar shows the real avatar/initial and gets the accent border when `/account` is the active route. Skip if you can't easily preview live.

- [ ] **Step 7: Lint + build**

```bash
npm run lint
npm run build
```
Build must fully succeed. Lint should stay at the 6-problem baseline.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/AccountPage.jsx client/src/pages/AccountPage.css client/src/App.jsx client/src/components/layout/TabBar.jsx client/src/components/layout/TabBar.css
git commit -m "feat: add mobile Account page, replace Houses with You in the tab bar"
```

---

## Final Self-Review Checklist (run once all tasks are done)

- [ ] `npm run lint && npm run build` clean from a fresh `client/` checkout.
- [ ] Every route added/changed by this plan renders without console errors: `/settings`, `/account`. `/profile/edit` is fully gone (404s via the catch-all).
- [ ] `grep -rn "EditProfileModal\|EditProfilePage\|refreshProfile" client/src` returns nothing (the last one confirms the old dead `useAuth().refreshProfile()` call is gone with the file that used it).
- [ ] Desktop: clicking the navbar avatar opens AccountMenu; clicking outside or Escape closes it; "Settings" and "Your shelf" links navigate correctly.
- [ ] Mobile (≤900px): tab bar shows Feed/Index/+/Shelf/You, no Houses. `/account` renders the mobile account page correctly at both mobile and (as a fallback) desktop widths.
- [ ] Settings: toggling any switch or editing Handle/Bio enables "Save changes"; saving persists and the button disables again; avatar upload works independently of the Save gate; "Send link" triggers a real Supabase password-reset email; "Delete account" shows a confirmation dialog with accurate copy before calling the real Edge Function.
