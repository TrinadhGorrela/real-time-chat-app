import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('email');
    const storedUsername = localStorage.getItem('username');

    if (storedToken && storedEmail && storedUsername) {
      setToken(storedToken);
      setUser({ email: storedEmail, name: storedUsername });
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setToken(userData.token);
    setUser(userData.user);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('email', userData.user.email);
    localStorage.setItem('username', userData.user.name);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
