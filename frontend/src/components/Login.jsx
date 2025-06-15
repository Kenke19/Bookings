import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AuthForms.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (credentials) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/login.php', {
        method: 'POST',
        body: JSON.stringify(credentials),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        login({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role
        });

        navigate(data.user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login.php', {
        method: 'POST',
        body: JSON.stringify({
          forgot_password: true,
          email: email
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setResetSent(true);
      } else {
        setError(data.error || 'Failed to send reset link');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleLogin({ email, password });
  };

  return (
    <div className="auth-root">
      
      <div className="auth-overlay"></div>
      <div className="auth-card">
        <Link to="/" className="back-arrow-link">
        <span className="arrow">&#8592;</span> Back to Home 
      </Link>
        <h2>Login</h2>
        
{!showForgotPassword ? (
  <form onSubmit={onSubmit}>
    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
      autoComplete="username"
      placeholder="Email"
    />
    <input
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
      autoComplete="current-password"
      placeholder="Password"
    />
    <button
      type="button"
      onClick={() => setShowForgotPassword(true)}
      className="auth-link"
      style={{ margin: '0.5rem 0 0.2rem 0', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      Forgot password?
    </button>
    {error && <p className="error-message">{error}</p>}
    <button type="submit" disabled={loading} className="auth-btn">
      {loading ? 'Logging in...' : 'Login'}
    </button>
  </form>
) : (
  <form
    onSubmit={e => {
      e.preventDefault();
      handleForgotPassword();
    }}
    style={{ width: '100%' }}
  >
    <h3 style={{ fontWeight: 500, fontSize: '1.1rem', marginBottom: '1rem', color: '#23272f' }}>
      Enter your email to reset password
    </h3>
    {resetSent ? (
      <>
        <p style={{ color: '#1976d2', marginBottom: '1.2rem' }}>
          Password reset link sent to your email!
        </p>
        <button
          type="button"
          onClick={() => {
            setShowForgotPassword(false);
            setResetSent(false);
          }}
          className="auth-btn"
        >
          Back to Login
        </button>
      </>
    ) : (
      <>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
        />
        {error && <p className="error-message">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="auth-btn"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        <button
          type="button"
          onClick={() => setShowForgotPassword(false)}
          className="auth-link"
          style={{ marginTop: '0.7rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          Back to Login
        </button>
      </>
    )}
  </form>
)}
        <div className="bottom-text">
          <span>Don't have an account? </span>
          <Link to="/register" className="auth-link">Register</Link>
        </div>
      </div>
    </div>
  );
}