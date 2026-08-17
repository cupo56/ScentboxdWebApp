import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AuthPage.css';

export default function AuthPage({ initialMode = 'signin' }) {
  const { login, register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const switchMode = (next) => {
    clearError();
    setMode(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (mode === 'signin') {
      if (await login(email, password)) navigate('/');
    } else if (await register(email, password, username)) {
      switchMode('signin');
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <h1 className="auth__headline">Keep a shelf, not a browser tab full of names.</h1>
        <p className="auth__sub">Free. Rate what you wear, follow the notes you like, and never blind-buy the same mistake twice.</p>

        <div className="auth__segment">
          <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => switchMode('signin')}>Sign in</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Create account</button>
        </div>

        {error && <p className="auth__error">{error}</p>}

        <form className="auth__form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth__field">
              <label>Username</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="scentlover42" pattern="^[a-zA-Z0-9_]{3,20}$" required />
            </div>
          )}
          <div className="auth__field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="auth__field">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={mode === 'register' ? 6 : undefined} required />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign in' : 'Create account')}
          </button>
          {mode === 'signin' && (
            <div className="auth__links">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          )}
        </form>

        <div className="auth__footnote">By continuing you agree to the terms. We only email you about your own account.</div>
      </div>
    </div>
  );
}
