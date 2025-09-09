import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Verify token and get user info
      authAPI.verifyToken(token)
        .then(user => {
          setCurrentUser(user);
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (name, email, password, phone) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          role: 'admin'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Don't login automatically - just return success
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login(email, password);
    if (response.token) {
      localStorage.setItem('adminToken', response.token);
      setCurrentUser(response.user);
    }
    return response;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}