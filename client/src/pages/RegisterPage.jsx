import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AuthPage.css';

export default function RegisterPage() {
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const success = await register(email, password, username);
    if (success) {
      navigate('/login');
    }
  };

  return (
    <div className="auth-page page">
      <div className="container">
        <div className="auth-card">
          <h1 className="auth-card__title">Create your account</h1>
          <p className="auth-card__subtitle">Join the Scentboxd community</p>

          {error && <p className="auth-card__error">{error}</p>}

          <form onSubmit={handleSubmit} className="auth-card__form">
            <div className="auth-card__field">
              <label>Username</label>
              <input
                className="input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="scentlover42"
                pattern="^[a-zA-Z0-9_]{3,20}$"
                title="3-20 characters, letters, numbers, underscores"
                required
                id="register-username"
              />
            </div>
            <div className="auth-card__field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                id="register-email"
              />
            </div>
            <div className="auth-card__field">
              <label>Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
                id="register-password"
              />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="auth-card__footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
