import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  isApplicant: boolean;
  isConsultant: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nexora_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexora_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyUser() {
      const activeToken = localStorage.getItem('nexora_token');
      if (activeToken) {
        try {
          const res = await apiClient.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('nexora_user', JSON.stringify(res.data.user));
          }
        } catch (e) {
          // Token invalid or expired
          setUser(null);
          localStorage.removeItem('nexora_token');
          localStorage.removeItem('nexora_refresh_token');
          localStorage.removeItem('nexora_user');
        }
      }
      setIsLoading(false);
    }
    verifyUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('nexora_token', res.data.accessToken);
      localStorage.setItem('nexora_refresh_token', res.data.refreshToken);
      localStorage.setItem('nexora_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setToken(res.data.accessToken);
    }
    return res.data;
  };

  const register = async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    if (res.data.success) {
      localStorage.setItem('nexora_token', res.data.accessToken);
      localStorage.setItem('nexora_refresh_token', res.data.refreshToken);
      localStorage.setItem('nexora_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setToken(res.data.accessToken);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network error on logout
    } finally {
      localStorage.removeItem('nexora_token');
      localStorage.removeItem('nexora_refresh_token');
      localStorage.removeItem('nexora_user');
      setUser(null);
      setToken(null);
      window.location.href = '/login';
    }
  };

  const isApplicant = user?.role === 'APPLICANT';
  const isConsultant = user?.role === 'CONSULTANT';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loading: isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        isApplicant,
        isConsultant,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
