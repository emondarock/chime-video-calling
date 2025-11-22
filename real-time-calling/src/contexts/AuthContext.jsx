import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        const userInfo = authAPI.getUserInfo();
        if (userInfo) {
          setUser(userInfo);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        authAPI.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password, lat = 23.8250779, long = 90.3600579) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(email, password, lat, long);
      const { accessToken, idToken, refreshToken } = response.data;

      // Store tokens
      authAPI.saveTokens(accessToken, idToken, refreshToken);

      // Decode and set user info
      const userInfo = authAPI.getUserInfo();
      setUser(userInfo);

      return { success: true, user: userInfo };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setError(null);
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('accessToken');
  };

  const hasRole = (allowedRoles) => {
    if (!user || !user.role) return false;
    return Array.isArray(allowedRoles)
      ? allowedRoles.includes(user.role)
      : allowedRoles === user.role;
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
