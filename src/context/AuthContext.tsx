import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AdminUser, AppSettings } from '../types/index.js';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AuthContextType {
  user: User | null;
  admin: AdminUser | null;
  role: 'user' | 'admin' | 'guest';
  token: string | null;
  isLoading: boolean;
  appSettings: AppSettings | null;
  activeView: string;
  setActiveView: (view: string) => void;
  // Modals
  authModal: 'login' | 'register' | 'admin_login' | 'forgot' | null;
  setAuthModal: (modal: 'login' | 'register' | 'admin_login' | 'forgot' | null) => void;
  // Toasts
  toasts: ToastItem[];
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
  // Actions
  loginUser: (email: string, password: string) => Promise<void>;
  registerUser: (data: { name: string; email: string; phone?: string; password: string; referralCode?: string }) => Promise<void>;
  loginAdmin: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('se_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [authModal, setAuthModal] = useState<'login' | 'register' | 'admin_login' | 'forgot' | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/user/settings', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setAppSettings(data.settings);
      }
    } catch (err) {
      console.warn('Failed to fetch settings:', err);
    }
  }, [token]);

  const refreshProfile = useCallback(async () => {
    const savedToken = localStorage.getItem('se_token');
    if (!savedToken) {
      setUser(null);
      setAdmin(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.role === 'admin') {
          setAdmin(data.admin);
          setUser(null);
          // If in guest dashboard, switch to admin overview
          if (activeView === 'dashboard') {
            setActiveView('admin_overview');
          }
        } else if (data.role === 'user') {
          setUser(data.user);
          setAdmin(null);
        }
      } else {
        localStorage.removeItem('se_token');
        setToken(null);
        setUser(null);
        setAdmin(null);
      }
    } catch {
      localStorage.removeItem('se_token');
      setToken(null);
      setUser(null);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeView]);

  useEffect(() => {
    refreshProfile();
    refreshSettings();

    // Auto-sync settings and profile in background every 10 seconds
    const interval = setInterval(() => {
      refreshSettings();
      if (localStorage.getItem('se_token')) {
        refreshProfile();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshProfile, refreshSettings, activeView]);

  const loginUser = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }
    localStorage.setItem('se_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAdmin(null);
    setAuthModal(null);
    setActiveView('dashboard');
    addToast('success', `Welcome back, ${data.user.name}!`);
  };

  const registerUser = async (formData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    referralCode?: string;
  }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }
    localStorage.setItem('se_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAdmin(null);
    setAuthModal(null);
    setActiveView('dashboard');
    addToast('success', 'Account created! Welcome to SULTAN EARN.');
  };

  const loginAdmin = async (username: string, password: string) => {
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Admin login failed.');
    }
    localStorage.setItem('se_token', data.token);
    setToken(data.token);
    setAdmin(data.admin);
    setUser(null);
    setAuthModal(null);
    setActiveView('admin_overview');
    addToast('success', `Administrator console unlocked for ${data.admin.username}`);
  };

  const logout = () => {
    localStorage.removeItem('se_token');
    setToken(null);
    setUser(null);
    setAdmin(null);
    setActiveView('dashboard');
    addToast('info', 'Logged out successfully.');
  };

  const role: 'user' | 'admin' | 'guest' = admin ? 'admin' : user ? 'user' : 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        role,
        token,
        isLoading,
        appSettings,
        activeView,
        setActiveView,
        authModal,
        setAuthModal,
        toasts,
        addToast,
        removeToast,
        loginUser,
        registerUser,
        loginAdmin,
        logout,
        refreshProfile,
        refreshSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
