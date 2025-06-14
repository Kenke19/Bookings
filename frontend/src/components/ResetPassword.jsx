import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error === 'invalid_token') {
      setFormError('Invalid or expired reset link. Please request a new one.');
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormError(null);
    
    // Validate inputs
    const errors = [];
    if (!token) errors.push('Invalid reset link');
    if (newPassword.length < 8) errors.push('Password must be at least 8 characters');
    if (newPassword !== confirmPassword) errors.push('Passwords do not match');
    
    if (errors.length > 0) {
      setFormError(errors.join(' • '));
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost/Bookings/backend/api/reset_password.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          token,
          new_password: newPassword
        }),
        credentials: 'include'
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server error: ${text.substring(0, 100)}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed');
      }
      
      setSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setFormError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
        <h2>Password Reset Successful</h2>
        <p>Your password has been successfully updated.</p>
        <button 
          onClick={() => navigate('/login')}
          style={{ 
            width: '100%', 
            padding: '10px', 
            marginTop: '10px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Login Now
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Reset Password</h2>
      {formError && (
        <div style={{ 
          color: 'red', 
          marginBottom: 10,
          padding: '10px',
          backgroundColor: '#ffeeee',
          borderRadius: '4px'
        }}>
          {formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Hidden username field for accessibility */}
        <input 
          type="text" 
          name="username" 
          autoComplete="username" 
          style={{ display: 'none' }}
          aria-hidden="true"
        />
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>
            New Password (min 8 characters):
          </label>
          <input
            type="password"
            name="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={{ 
              width: '100%', 
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 5 }}>
            Confirm Password:
          </label>
          <input
            type="password"
            name="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={{ 
              width: '100%', 
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !token}
          style={{ 
            width: '100%', 
            padding: '12px',
            backgroundColor: loading ? '#cccccc' : '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Processing...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}