import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('trendora_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // On mount — verify token is still valid
  useEffect(() => {
    const token = localStorage.getItem('trendora_token');
    if (!token) {
      setInitializing(false);
      return;
    }
    authAPI.getMe()
      .then(res => {
        setUser(res.user);
        localStorage.setItem('trendora_user', JSON.stringify(res.user));
      })
      .catch(() => {
        localStorage.removeItem('trendora_token');
        localStorage.removeItem('trendora_user');
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem('trendora_token', res.token);
      localStorage.setItem('trendora_user', JSON.stringify(res.user));
      setUser(res.user);
      toast.success(`Welcome back, ${res.user.name?.split(' ')[0]}!`);
      return { success: true, user: res.user };
    } catch (err) {
      const msg = err.message || 'Login failed';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.register(data);
      localStorage.setItem('trendora_token', res.token);
      localStorage.setItem('trendora_user', JSON.stringify(res.user));
      setUser(res.user);
      toast.success('Account created successfully!');
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Registration failed';
      toast.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('trendora_token');
    localStorage.removeItem('trendora_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('trendora_user', JSON.stringify(updatedUser));
  };

  // ✅ NEW: loginWithToken — used after Google OAuth redirect
  const loginWithToken = async (token) => {
    try {
      // Save token first
      localStorage.setItem('trendora_token', token);
      // Fetch user details using the token
      const res = await authAPI.getMe();
      localStorage.setItem('trendora_user', JSON.stringify(res.user));
      setUser(res.user);
      toast.success(`Welcome, ${res.user.name?.split(' ')[0]}! 🎉`);
      return { success: true, user: res.user };
    } catch (err) {
      // If failed, clear everything
      localStorage.removeItem('trendora_token');
      localStorage.removeItem('trendora_user');
      setUser(null);
      toast.error('Google login failed. Please try again.');
      return { success: false };
    }
  };

  // Show loader while verifying token
  if (initializing) {
    return (
      <div style={{
        backgroundColor: '#111111',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            color: '#C9A84C',
            fontSize: '22px',
            letterSpacing: '0.3em',
            fontFamily: 'serif',
            marginBottom: '16px'
          }}>
            TRENDORRA
          </div>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid rgba(201,168,76,0.2)',
            borderTopColor: '#C9A84C',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      updateUser, isAdmin, isLoggedIn: !!user,
      loginWithToken, // ✅ NEW: exposed for GoogleAuthSuccess page
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};