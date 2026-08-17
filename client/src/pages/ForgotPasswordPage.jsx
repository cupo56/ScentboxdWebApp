import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './AuthPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  return (
    <div className="auth">
      <div className="container">
        <div className="auth__card">
          {sent ? (
            <>
              <div className="auth__success-icon">✉️</div>
              <h1 className="auth__headline">Check your email</h1>
              <p className="auth__sub">
                We've sent a password reset link to <strong>{email}</strong>.
                Click the link in the email to set a new password.
              </p>
              <p className="auth__hint">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => setSent(false)}
                style={{ width: '100%', marginTop: '8px' }}
                id="resend-reset"
              >
                Try again
              </button>
              <p className="auth__footer">
                <Link to="/login">← Back to sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="auth__headline">Forgot your password?</h1>
              <p className="auth__sub">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && <p className="auth__error">{error}</p>}

              <form onSubmit={handleSubmit} className="auth__form">
                <div className="auth__field">
                  <label>Email</label>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    id="forgot-email"
                  />
                </div>
                <button
                  className="btn btn-primary btn-lg"
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%' }}
                  id="send-reset-link"
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p className="auth__footer">
                Remember your password? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
