import React, { useState, useEffect } from 'react';
import Form from "./ReservationForm";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MessageSystem from './MessageSystem';
import './User.css';
import loaderImg from '../assets/load_img.gif'; 


export default function UserDashboard() {
  const [reservations, setReservations] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('reservations');
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchReservations() {
      if (!user) return;
      
      setDashboardLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/user_reservations.php', {
          credentials: 'include',
        });
        
        if (!res.ok) throw new Error('Network response was not ok');
        
        const data = await res.json();
        
        if (data.success) {
          setReservations(data.reservations || []);
        } else {
          throw new Error(data.error || 'Failed to load reservations');
        }
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);
      } finally {
        setDashboardLoading(false);
      }
    }

    fetchReservations();
  }, [user]); // Re-fetch when user changes

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Combined loading states
  if (authLoading) {
    return <div className="loading">Checking authentication...</div>;
  }

  if (!user) {
    // This will briefly show before navigate() kicks in
    return <div className="loading">Redirecting to login...</div>;
  }

  if (dashboardLoading && activeTab === 'reservations') {
  return (
    <div className="dashboard-loading-center">
      <img src={loaderImg} alt="Loading..." className="dashboard-loader-img" />
    </div>
  );
  }

  if (error) {
    return (
      <div className="error">
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <h2 className="dashboard-title">Welcome {user.name}</h2>
      <button onClick={handleLogout} className="logout-btn" style={{ float: 'right' }}>
        Logout
      </button>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          onClick={() => setActiveTab('reservations')} 
          className={`tab-btn${activeTab === 'reservations' ? ' active' : ''}`}
        >
          Reservations
        </button>
        <button 
          onClick={() => setActiveTab('new-reservation')} 
          className={`tab-btn${activeTab === 'new-reservation' ? ' active' : ''}`}
        >
          Create Reservation
        </button>
        <button 
          onClick={() => setActiveTab('messages')} 
          className={`tab-btn${activeTab === 'messages' ? ' active' : ''}`}
        >
          Messages
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'reservations' && (
          <>
            <h3 className="reservations-title">Your Reservations</h3>
            {reservations.length === 0 ? (
              <p className="no-reservations-msg">You have no reservations.</p>
            ) : (
              <table className="reservations-table" border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.date}</td>
                      <td>{r.amount}</td>
                      <td>{r.status}</td>
                      <td>{r.payment_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
        
        {activeTab === 'new-reservation' && <Form />}
        
        {activeTab === 'messages' && (
          <MessageSystem 
            currentUserId={user.id} 
            key={user.id} 
          />
        )}
      </div>
    </div>
  );
}