import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, clearStoredUser, getStoredUser, saveStoredUser } from '../services/api';
import { User } from '../types';
import { useToast } from './ToastContext';

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{ email: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<User>;
  changePassword: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  openAuthModal: (mode?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot';
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');
  const { showToast } = useToast();

  const openAuthModal = (mode: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Sync stored user and test profile on boot if token exists
  useEffect(() => {
    const user = getStoredUser();
    if (user?.token) {
      setCurrentUser(user);
      api
        .getProfile()
        .then((profile) => {
          if (profile) {
            const merged = { ...user, ...profile };
            setCurrentUser(merged);
            saveStoredUser(merged);
          }
        })
        .catch((err) => {
          if (err?.status === 401) {
            clearStoredUser();
            setCurrentUser(null);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    const handleUnauthorized = () => {
      setCurrentUser(null);
      showToast('Session expired. Please sign in again.', 'warning');
    };

    window.addEventListener('zyphora:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('zyphora:unauthorized', handleUnauthorized);
    };
  }, [showToast]);

  const login = async (email: string, password: string): Promise<User> => {
    const user = await api.login({ email, password });
    setCurrentUser(user);
    closeAuthModal();
    showToast(`Welcome back, ${user.username || 'Shopper'}!`, 'success');
    return user;
  };

  const register = async (payload: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }) => {
    const res = await api.register(payload);
    return res;
  };

  const verifyOtp = async (email: string, otp: string) => {
    await api.verifyOtp({ email, otp });
    showToast('Account verified successfully! You can now sign in.', 'success');
    setAuthModalMode('login');
  };

  const logout = () => {
    clearStoredUser();
    setCurrentUser(null);
    showToast('You have been signed out.', 'info');
  };

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    const updated = await api.updateProfile(data);
    setCurrentUser(updated);
    showToast('Profile updated successfully.', 'success');
    return updated;
  };

  const changePassword = async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    await api.changePassword(payload);
    showToast('Password changed successfully.', 'success');
  };

  const deleteAccount = async () => {
    await api.deleteProfile();
    clearStoredUser();
    setCurrentUser(null);
    showToast('Your account has been deleted.', 'info');
  };

  const refreshProfile = async () => {
    if (!currentUser?.token) return;
    try {
      const p = await api.getProfile();
      if (p) {
        const merged = { ...currentUser, ...p };
        setCurrentUser(merged);
        saveStoredUser(merged);
      }
    } catch {
      // ignore
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';
  const isAuthenticated = !!currentUser?.token;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        register,
        verifyOtp,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
        refreshProfile,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
