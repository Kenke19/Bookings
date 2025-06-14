import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/logout.php', { method: 'POST' })
      .then(() => {
        logout();
        navigate('/login');
      })
      .catch(() => {
        logout();
        navigate('/login');
      });
  }, []);

  return <p>Logging out...</p>;
}
