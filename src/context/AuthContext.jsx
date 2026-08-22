import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

const DEMO_VIRTUAL_NUMBER = '+91 92345 00110';
const DEMO_OTP = '123456';
const DEMO_ACCESS_TOKEN = 'demo-access-token';

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

const getDemoUser = () => ({
  id: 'demo-user-1',
  name: 'Infyle Demo Reseller',
  email: 'demo@infyle.com',
  role: 'Reseller',
  virtualNumber: DEMO_VIRTUAL_NUMBER,
  businessName: 'Infyle Technologies',
  connectedSince: new Date().toISOString(),
  waBusinessStatus: 'connected',
  tenantId: 'tenant-demo-1',
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = localStorage.getItem('wa_access_token');
    const stored = localStorage.getItem('wa_session_user');
    
    if (token && stored && token !== DEMO_ACCESS_TOKEN) {
      try {
        const res = await axiosInstance.get('/auth/me');
        setUser(res.user);
      } catch {
        localStorage.removeItem('wa_access_token');
        localStorage.removeItem('wa_session_user');
        localStorage.removeItem('wa_tenant_id');
        localStorage.removeItem('wa_refresh_token');
        // Fallback to demo user
        const demoUser = getDemoUser();
        setUser(demoUser);
        localStorage.setItem('wa_session_user', JSON.stringify(demoUser));
        localStorage.setItem('wa_access_token', DEMO_ACCESS_TOKEN);
        localStorage.setItem('wa_tenant_id', 'tenant-demo-1');
      }
    } else if (stored) {
      setUser(JSON.parse(stored));
    } else {
      // No session - auto-login with demo user for development
      const demoUser = getDemoUser();
      setUser(demoUser);
      localStorage.setItem('wa_session_user', JSON.stringify(demoUser));
      localStorage.setItem('wa_access_token', DEMO_ACCESS_TOKEN);
      localStorage.setItem('wa_tenant_id', 'tenant-demo-1');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const setSession = (userData, accessToken, tenantId = 'tenant-demo-1') => {
    localStorage.setItem('wa_session_user', JSON.stringify(userData));
    localStorage.setItem('wa_access_token', accessToken);
    localStorage.setItem('wa_tenant_id', tenantId);
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem('wa_session_user');
    localStorage.removeItem('wa_access_token');
    localStorage.removeItem('wa_tenant_id');
    localStorage.removeItem('wa_refresh_token');
    setUser(null);
  };

  const requestOtp = async (virtualNumber) => {
    await new Promise((r) => setTimeout(r, 700));
    if (virtualNumber.replace(/\s/g, '') !== DEMO_VIRTUAL_NUMBER.replace(/\s/g, '')) {
      throw new Error('Virtual number not recognized. Use the demo number shown below.');
    }
    return { sent: true, expiresIn: 300 };
  };

  const verifyOtp = async (virtualNumber, otp) => {
    await new Promise((r) => setTimeout(r, 900));
    if (otp !== DEMO_OTP) {
      throw new Error('Incorrect OTP. Please try again.');
    }

    try {
      const res = await axiosInstance.post('/auth/verify-otp', { virtualNumber, otp });
      setSession(res.user, res.accessToken, res.user.tenantId);
      return res.user;
    } catch {
      const sessionUser = {
        name: 'Infyle Demo Reseller',
        role: 'Reseller',
        virtualNumber,
        businessName: 'Infyle Technologies',
        connectedSince: new Date().toISOString(),
        waBusinessStatus: 'connected',
        tenantId: 'tenant-demo-1',
      };
      setSession(sessionUser, 'demo-access-token', 'tenant-demo-1');
      return sessionUser;
    }
  };

  const login = async (email, password) => {
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    if (!validatePassword(password)) {
      throw new Error('Password must be at least 8 characters');
    }

    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      setSession(res.user, res.accessToken, res.user.tenantId);
      return res.user;
    } catch (error) {
      if (error.status === 401) throw new Error('Invalid email or password');
      if (error.status === 403) throw new Error('Account is deactivated');
      throw new Error(error.message || 'Login failed');
    }
  };

  const signup = async (name, email, password, confirmPassword) => {
    if (!name.trim()) {
      throw new Error('Please enter your name');
    }
    if (!validateEmail(email)) {
      throw new Error('Please enter a valid email address');
    }
    if (!validatePassword(password)) {
      throw new Error('Password must be at least 8 characters');
    }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    try {
      const res = await axiosInstance.post('/auth/signup', { name, email, password });
      setSession(res.user, res.accessToken, res.user.tenantId);
      return res.user;
    } catch (error) {
      if (error.status === 409) throw new Error('An account with this email already exists');
      throw new Error(error.message || 'Signup failed');
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        requestOtp,
        verifyOtp,
        login,
        signup,
        logout,
        DEMO_VIRTUAL_NUMBER,
        DEMO_OTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);