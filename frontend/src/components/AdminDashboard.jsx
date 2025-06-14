import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MessageSystem from './MessageSystem';
import './Admin.css';

// Reusable Users Table (unchanged)
function UsersTable({ users }) {
  return (
    <section className="admin-users-section">
      <table className="admin-users-table" border="1" cellPadding="5">
        <thead>
          <tr>
            <th className="admin-users-th">ID</th>
            <th className="admin-users-th">Name</th>
            <th className="admin-users-th">Email</th>
            <th className="admin-users-th">Role</th>
            <th className="admin-users-th">Created At</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="admin-users-tr">
              <td className="admin-users-td">{u.id}</td>
              <td className="admin-users-td">{u.name}</td>
              <td className="admin-users-td">{u.email}</td>
              <td className="admin-users-td">{u.role}</td>
              <td className="admin-users-td">{u.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// Reusable Reservations Table (unchanged)
function ReservationsTable({ reservations, onConfirm, onCancel, onUpdateStatus }) {
  // Helper to get status color class
  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return '';
    }
  };

  return (
    <section className="admin-reservations-section">
      <table className="admin-reservations-table" border="1" cellPadding="5">
        <thead>
          <tr>
            <th className="admin-reservations-th">ID</th>
            <th className="admin-reservations-th">Email</th>
            <th className="admin-reservations-th">Date</th>
            <th className="admin-reservations-th">Amount</th>
            <th className="admin-reservations-th">Reservation Status</th>
            <th className="admin-reservations-th">Payment Status</th>
            <th className="admin-reservations-th">Payment Ref</th>
            <th className="admin-reservations-th">Reservation Actions</th>
            <th className="admin-reservations-th">Payment Actions</th>
            <th className="admin-reservations-th">Created At</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.id} className="admin-reservations-tr">
              <td className="admin-reservations-td">{r.id}</td>
              <td className="admin-reservations-td">{r.email}</td>
              <td className="admin-reservations-td">{r.date}</td>
              <td className="admin-reservations-td">{r.amount}</td>
              <td className={`admin-reservations-td`}>
                <span className={`status-badge ${getStatusClass(r.status)}`}>
                  {r.status}
                </span>
              </td>
              <td className={`admin-reservations-td`}>
                <span className={`status-badge ${getStatusClass(r.payment_status)}`}>
                  {r.payment_status}
                </span>
              </td>
              <td className="admin-reservations-td">{r.payment_reference || 'N/A'}</td>
              <td className="admin-reservations-td">
                {r.status !== 'cancelled' && r.status !== 'completed' && (
                  <>
                    {r.payment_status === 'confirmed' && r.status === 'pending' && (
                      <button onClick={() => onUpdateStatus(r.id, 'confirm_reservation')}>Confirm Reservation</button>
                    )}
                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <button onClick={() => window.confirm(`Cancel reservation #${r.id}?`) && onUpdateStatus(r.id, 'cancel_reservation')} style={{ marginLeft: 8 }}>
                        Cancel Reservation
                      </button>
                    )}
                    {r.status === 'confirmed' && (
                      <button onClick={() => onUpdateStatus(r.id, 'complete_reservation')} style={{ marginLeft: 8 }}>
                        Completed Reservation
                      </button>
                    )}
                  </>
                )}
              </td>
              <td className="admin-reservations-td">
                {r.status !== 'cancelled' && r.status !== 'completed' && (
                  <>
                    {r.payment_status === 'pending' && r.status === 'pending' && (
                      <button onClick={() => onConfirm(r)} style={{ marginRight: 8, background: 'green', color: 'white' }}>
                        Confirm Payment
                      </button>
                    )}
                    {(r.payment_status === 'pending' || (r.payment_status === 'confirmed' && r.status === 'pending')) && (
                      <button onClick={() => onCancel(r)} style={{ marginRight: 8, background: 'red', color: 'white' }}>
                        Cancel Payment
                      </button>
                    )}
                  </>
                )}
              </td>
              <td className="admin-reservations-td">{r.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reservations');
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setDataLoading(true);
    try {
      const [usersRes, reservationsRes] = await Promise.all([
        fetch('/api/admin_data.php?type=users', { 
          credentials: 'include',
          headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {}
        }),
        fetch('/api/admin_data.php?type=reservations', { 
          credentials: 'include',
          headers: user?.token ? { 'Authorization': `Bearer ${user.token}` } : {}
        }),
      ]);
      
      if (!usersRes.ok) throw new Error('Failed to fetch users');
      if (!reservationsRes.ok) throw new Error('Failed to fetch reservations');
      
      const usersData = await usersRes.json();
      const reservationsData = await reservationsRes.json();
      
      setUsers(usersData.users || []);
      setReservations(reservationsData.reservations || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      // Optionally show error to user
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => { 
    fetchData();
  }, [fetchData]);

  // Payment actions
  const confirmPayment = async (reservation) => {
    const paymentRef = window.prompt('Enter payment reference:');
    if (!paymentRef) {
      alert('Payment reference is required.');
      return;
    }
    if (!window.confirm(`Confirm payment for reservation #${reservation.id}?`)) return;

    try {
      const response = await fetch('/api/manage_payment.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          reservation_id: reservation.id,
          action: 'confirm',
          payment_reference: paymentRef,
        }),
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to confirm payment.');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Error confirming payment. Please try again.');
    }
  };

  const cancelPayment = async (reservation) => {
    if (!window.confirm(`Cancel payment for reservation #${reservation.id}?`)) return;
    
    try {
      const response = await fetch('/api/manage_payment.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ reservation_id: reservation.id, action: 'cancel' }),
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      fetchData();
    } catch (error) {
      console.error('Error canceling payment:', error);
      alert('Error canceling payment. Please try again.');
    }
  };

  const updateReservationStatus = async (id, action) => {
    try {
      const response = await fetch('/api/admin_actions.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.token ? { 'Authorization': `Bearer ${user.token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ reservation_id: id, action }),
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      fetchData();
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Error updating reservation. Please try again.');
    }
  };

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!user) {
    return null; // Already redirected in useEffect
  }

  if (dataLoading) {
    return <div>Loading dashboard data...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <button onClick={logout} className="admin-logout-btn" style={{ float: 'right' }}>Logout</button>
      <h2 className="admin-dashboard-title">Admin Dashboard</h2>
      
      {/* Tab Navigation */}
      <div className="admin-tabs-nav" style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('reservations')} 
          className={`admin-tab-btn${activeTab === 'reservations' ? ' active' : ''}`}
          style={{ 
            marginRight: '10px', 
            fontWeight: activeTab === 'reservations' ? 'bold' : 'normal',
            background: activeTab === 'reservations' ? '#f0f0f0' : 'transparent'
          }}
        > Reservations
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`admin-tab-btn${activeTab === 'users' ? ' active' : ''}`} 
          style={{ 
            marginRight: '10px', 
            fontWeight: activeTab === 'users' ? 'bold' : 'normal',
            background: activeTab === 'users' ? '#f0f0f0' : 'transparent'
          }}
        >
          Users
        </button>
        <button 
          onClick={() => setActiveTab('messages')} 
          className={`admin-tab-btn${activeTab === 'messages' ? ' active' : ''}`}
          style={{ 
            fontWeight: activeTab === 'messages' ? 'bold' : 'normal',
            background: activeTab === 'messages' ? '#f0f0f0' : 'transparent'
          }}
        >
          Messages
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'reservations' && (
        <ReservationsTable
          reservations={reservations}
          onConfirm={confirmPayment}
          onCancel={cancelPayment}
          onUpdateStatus={updateReservationStatus}
        />
      )}
      
      {activeTab === 'users' && <UsersTable users={users} />}
      
      {activeTab === 'messages' && <MessageSystem currentUserId={user.id} />}
    </div>
  );
}