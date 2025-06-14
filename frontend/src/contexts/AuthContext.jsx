import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // This is the simple, working version you had before
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Ensure all user data is properly stored
    const completeUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email, // This was the missing piece
      role: userData.role
    };
    setUser(completeUser);
    localStorage.setItem('user', JSON.stringify(completeUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Your existing logout.php will handle server-side cleanup
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout,
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}