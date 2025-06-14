import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForms.css'; // See CSS notes below

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        alert('Registration successful! Please login.');
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-overlay"></div>
      <div className="auth-card">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
            autoComplete="name"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div className="bottom-text">
          <span>Already have an account? </span>
          <Link to="/login" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
}