import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { isBrowserDemo } from '../services/api.js';
import { useCards } from '../context/CardContext';

function LoginPage() {
  const navigate = useNavigate();
  const { reloadCards } = useCards();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(email, password);
      await reloadCards();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTryDemo() {
    setError('');
    setLoading(true);
    try {
      await api.startDemo();
      await reloadCards();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-panel">
      <div className="auth-panel-header">
        <p className="auth-eyebrow">Quiet study</p>
        <h2>Welcome back</h2>
        <p className="auth-subtitle">
          {isBrowserDemo()
            ? 'GitHub Pages has no API — study a local demo deck in this browser, or make a demo account.'
            : 'Sit down at your desk and pick up where you left off.'}
        </p>
      </div>

      {isBrowserDemo() && (
        <button type="button" className="auth-submit" onClick={handleTryDemo} disabled={loading}>
          {loading ? 'Opening desk…' : 'Try the desk'}
        </button>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="auth-switch">
        No account? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
}

export default LoginPage;
