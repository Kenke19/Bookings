import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Message.css';

const MessageSystem = ({ currentUserId }) => {
  // State for replying to messages
  const [replyTo, setReplyTo] = useState(null); 
  const [replyMessage, setReplyMessage] = useState('');
  // State for sending messages
  const [formData, setFormData] = useState({
    recipient: '',
    subject: '',
    message: ''
  });
  
  // State for viewing messages
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' or 'inbox'
  const [loading, setLoading] = useState({
    users: true,
    messages: true,
    sending: false
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch users for recipient dropdown
  const fetchUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      setError(null);
      
      const response = await axios.get('/api/get_users.php', {
        params: { _: Date.now() },
        withCredentials: true
      });

      if (response.data.success) {
        setUsers(response.data.users.map(user => ({
          ...user,
          email: user.email || 'no-email@example.com'
        })));
      } else {
        throw new Error(response.data.error || 'Failed to load recipients');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.message || 'Failed to load recipients');
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // Fetch messages (both sent and received)
  const fetchMessages = async () => {
    try {
      setLoading(prev => ({ ...prev, messages: true }));
      setError(null);
      
      const response = await axios.get('/api/message_api.php', {
        params: { 
          action: 'get_messages',
          user_id: currentUserId
        },
        withCredentials: true
      });

      if (response.data.success) {
        setMessages(response.data.messages || []);
      } else {
        throw new Error(response.data.error || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load messages');
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  };

  // Handle sending messages
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.recipient || !formData.message) {
      setError('Recipient and message are required');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, sending: true }));
      
      const params = new URLSearchParams();
      params.append('action', 'send_message');
      params.append('receiver_id', formData.recipient);
      params.append('subject', formData.subject);
      params.append('message', formData.message);

      const response = await axios.post('/api/message_api.php', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        withCredentials: true
      });

      if (response.data.success) {
        setSuccess('Message sent successfully!');
        setFormData({ recipient: '', subject: '', message: '' });
        fetchMessages(); // Refresh messages after sending
      } else {
        throw new Error(response.data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Send error:', err);
      setError(err.response?.data?.error || err.message || 'Error sending message');
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      await axios.post('/api/message_api.php', {
        action: 'mark_as_read',
        message_id: messageId
      }, {
        withCredentials: true
      });
      fetchMessages(); // Refresh messages
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMessages();
  }, [currentUserId]);

  if (loading.users || loading.messages) {
    return <div className="loading">Loading messaging system...</div>;
  }

  return (
  <div className="message-system-container">
    <div className="message-system">
      
      {/* Tab Navigation */}
      <div className="message-tabs">
        <button
          className={`tab ${activeTab === 'compose' ? 'active' : ''}`}
          onClick={() => setActiveTab('compose')}
        >
          Compose
        </button>
        <button
          className={`tab ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox
        </button>
        <button
          className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Compose Message Form */}
      {activeTab === 'compose' && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Recipient:</label>
            <select
              value={formData.recipient}
              onChange={(e) => setFormData({...formData, recipient: e.target.value})}
              required
              disabled={users.length === 0 || loading.sending}
            >
              <option value="">{users.length ? 'Select recipient' : 'No recipients available'}</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subject (optional):</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              placeholder="Message subject"
              disabled={loading.sending}
            />
          </div>

          <div className="form-group">
            <label>Message:</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              required
              rows={5}
              placeholder="Type your message here..."
              disabled={loading.sending}
            />
          </div>

          <button 
            type="submit" 
            disabled={users.length === 0 || loading.sending}
          >
            {loading.sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}

      {/* Message Inbox */}
      {activeTab === 'inbox' && (
        <div className="message-list">
          {messages.length === 0 ? (
            <p>No messages found</p>
          ) : (
            messages
            .filter(msg => msg.receiver_id === currentUserId)
            .map(msg => (
              <div 
                key={msg.id} 
                className={`message ${!msg.is_read ? 'unread' : ''}`}
                onClick={e => {
                  if (
                    e.target.classList.contains('reply-btn') ||
                    e.target.tagName === 'TEXTAREA' ||
                    e.target.tagName === 'BUTTON' ||
                    e.target.closest('form')
                  ) {
                    return;
                  }
                    if (!msg.is_read && msg.receiver_id === currentUserId) markAsRead(msg.id);
                }}
              >
                <div className="message-header">
                  <strong>
                    {msg.sender_id === currentUserId 
                      ? <>To: {msg.receiver_name || msg.receiver_email || 'Unknown'}</>
                      : <>From: {msg.sender_name || msg.sender_email || 'Unknown'}</>
                    }
                  </strong>
                  <span className="message-date">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="message-subject">{msg.subject || '(No subject)'}</div>
                <div className="message-body">{msg.message}</div>
                {/* Reply button only if not sent by current user */}
                {msg.sender_id !== currentUserId && (
                  <button
                    type="button"
                    className="reply-btn"
                    onClick={() => {
                      setReplyTo(msg);
                      setReplyMessage('');
                    }}
                    style={{ marginTop: 8 }}
                  >
                    Reply
                  </button>
                )}
                {/* Show reply form if this message is being replied to */}
                {replyTo && replyTo.id === msg.id && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setError(null);
                      setSuccess(null);
                      try {
                        setLoading(prev => ({ ...prev, sending: true }));
                        const params = new URLSearchParams();
                        params.append('action', 'send_message');
                        params.append('receiver_id', replyTo.sender_id);
                        params.append('subject', replyTo.subject ? `Re: ${replyTo.subject}` : 'Re:');
                        params.append('message', replyMessage);

                        const response = await axios.post('/api/message_api.php', params, {
                          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                          withCredentials: true
                        });

                        if (response.data.success) {
                          setSuccess('Reply sent!');
                          setReplyTo(null);
                          setReplyMessage('');
                          fetchMessages();
                        } else {
                          throw new Error(response.data.error || 'Failed to send reply');
                        }
                      } catch (err) {
                        setError(err.response?.data?.error || err.message || 'Error sending reply');
                      } finally {
                        setLoading(prev => ({ ...prev, sending: false }));
                      }
                    }}
                    style={{ marginTop: 10 }}
                  >
                    <textarea
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      required
                      rows={3}
                      placeholder="Type your reply..."
                      disabled={loading.sending}
                      style={{ width: '100%', marginBottom: 8 }}
                    />
                    <button type="submit" disabled={loading.sending} style={{ marginRight: 8 }}>
                      {loading.sending ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button type="button" onClick={() => setReplyTo(null)}>
                      Cancel
                    </button>
                  </form>
                )}
              </div>
        ))
          )}
        </div>
      )}

      {/* Sent Tab */}
      {activeTab === 'sent' && (
        <div className="message-list">
          {messages.filter(msg => msg.sender_id === currentUserId).length === 0 ? (
            <p>No sent messages found</p>
          ) : (
            messages
              .filter(msg => msg.sender_id === currentUserId)
              .map(msg => (
                <div key={msg.id} className="message">
                  <div className="message-header">
                    <strong>
                      To: {msg.receiver_name || msg.receiver_email || 'Unknown'}
                    </strong>
                    <span className="message-date">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="message-subject">{msg.subject || '(No subject)'}</div>
                  <div className="message-body">{msg.message}</div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  </div>
  );
};

export default MessageSystem;