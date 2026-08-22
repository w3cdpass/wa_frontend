import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { ENDPOINTS } from '../api/endpoints';

const AuthContext = createContext(null);

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = localStorage.getItem('wa_access_token');

    if (token) {
      try {
        const res = await axiosInstance.get(ENDPOINTS.AUTH.ME);
        setUser(res.user);
        localStorage.setItem('wa_session_user', JSON.stringify(res.user));
      } catch {
        clearSession();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const setSession = (userData, accessToken, tenantId) => {
    localStorage.setItem('wa_session_user', JSON.stringify(userData));
    localStorage.setItem('wa_access_token', accessToken);
    if (tenantId) localStorage.setItem('wa_tenant_id', String(tenantId));
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem('wa_session_user');
    localStorage.removeItem('wa_access_token');
    localStorage.removeItem('wa_tenant_id');
    setUser(null);
  };

  const requestOtp = async (virtualNumber) => {
    try {
      return await axiosInstance.post(ENDPOINTS.AUTH.REQUEST_OTP, { virtualNumber });
    } catch (error) {
      throw new Error(error.message || 'Could not send OTP');
    }
  };

  const verifyOtp = async (virtualNumber, otp) => {
    try {
      const res = await axiosInstance.post(ENDPOINTS.AUTH.VERIFY_OTP, { virtualNumber, otp });
      setSession(res.user, res.accessToken, res.user.tenantId);
      return res.user;
    } catch (error) {
      throw new Error(error.message || 'OTP verification failed');
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
      const res = await axiosInstance.post(ENDPOINTS.AUTH.LOGIN, { email, password });
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
      const res = await axiosInstance.post(ENDPOINTS.AUTH.SIGNUP, { name, email, password });
      setSession(res.user, res.accessToken, res.user.tenantId);
      return res.user;
    } catch (error) {
      if (error.status === 409) throw new Error('An account with this email already exists');
      throw new Error(error.message || 'Signup failed');
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
