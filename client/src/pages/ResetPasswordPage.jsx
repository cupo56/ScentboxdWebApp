import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './AuthPage.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(null); // null = checking

  // Verify the user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setValidSession(!!session);
    };

    // Listen for the PASSWORD_RECOVERY event from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true);
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      // Sign out the recovery session so the user logs in fresh
      // This also prevents the authStore listener from doing extra work
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login'), 1500);
    }
  };

  // Still checking the session
  if (validSession === null) {
    return (
      <div className="auth">
        <div className="container">
          <div className="auth__card" style={{ textAlign: 'center' }}>
            <div className="spinner spinner-md" style={{ margin: '0 auto 16px' }}></div>
            <p className="auth__sub">Verifying reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  // No valid session — invalid or expired link
  if (!validSession) {
    return (
      <div className="auth">
        <div className="container">
          <div className="auth__card">
            <div className="auth__success-icon">⚠️</div>
            <h1 className="auth__headline">Invalid or expired link</h1>
            <p className="auth__sub">
              This password reset link is no longer valid. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '16px' }}
              id="request-new-link"
            >
              Request New Link
            </Link>
            <p className="auth__footer">
              <Link to="/login">← Back to sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="container">
        <div className="auth__card">
          {success ? (
            <>
              <div className="auth__success-icon">✅</div>
              <h1 className="auth__headline">Password updated!</h1>
              <p className="auth__sub">
                Your password has been successfully changed. Redirecting you to sign in…
              </p>
            </>
          ) : (
            <>
              <h1 className="auth__headline">Set a new password</h1>
              <p className="auth__sub">
                Enter your new password below. Must be at least 6 characters.
              </p>

              {error && <p className="auth__error">{error}</p>}

              <form onSubmit={handleSubmit} className="auth__form">
                <div className="auth__field">
                  <label>New Password</label>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    autoFocus
                    id="reset-password"
                  />
                </div>
                <div className="auth__field">
                  <label>Confirm Password</label>
                  <input
                    className="input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                    id="reset-password-confirm"
                  />
                </div>

                {/* Password match indicator */}
                {confirmPassword && (
                  <p className={`auth__match ${password === confirmPassword ? 'auth__match--ok' : 'auth__match--mismatch'}`}>
                    {password === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                  </p>
                )}

                <button
                  className="btn btn-primary btn-lg"
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%' }}
                  id="submit-new-password"
                >
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
