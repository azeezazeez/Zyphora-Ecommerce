import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  api,
  clearStoredUser,
  getStoredUser,
  saveStoredUser,
} from '../services/api';
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

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(
    getStoredUser()
  );

  const [loading, setLoading] = useState<boolean>(true);

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [authModalMode, setAuthModalMode] = useState<
    'login' | 'register' | 'forgot'
  >('login');

  const { showToast } = useToast();

  // -------------------------------------------------------------
  // AUTH MODAL
  // -------------------------------------------------------------

  const openAuthModal = (
    mode: 'login' | 'register' | 'forgot' = 'login'
  ) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // -------------------------------------------------------------
  // INITIAL AUTHENTICATION CHECK
  // -------------------------------------------------------------

  useEffect(() => {
    const user = getStoredUser();

    if (user?.token) {
      setCurrentUser(user);

      api
        .getProfile()
        .then((profile) => {
          if (profile) {
            // IMPORTANT:
            // Profile endpoint does not return JWT token.
            // Preserve the existing token.
            const merged: User = {
              ...user,
              ...profile,
              token: user.token,
            };

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
      clearStoredUser();
      setCurrentUser(null);

      showToast(
        'Session expired. Please sign in again.',
        'warning'
      );
    };

    window.addEventListener(
      'zyphora:unauthorized',
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        'zyphora:unauthorized',
        handleUnauthorized
      );
    };
  }, [showToast]);

  // -------------------------------------------------------------
  // LOGIN
  // -------------------------------------------------------------

  const login = async (
    email: string,
    password: string
  ): Promise<User> => {
    const user = await api.login({
      email,
      password,
    });

    setCurrentUser(user);

    closeAuthModal();

    showToast(
      `Welcome back, ${user.username || 'Shopper'}!`,
      'success'
    );

    return user;
  };

  // -------------------------------------------------------------
  // REGISTER
  // -------------------------------------------------------------

  const register = async (payload: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }) => {
    const res = await api.register(payload);
    return res;
  };

  // -------------------------------------------------------------
  // VERIFY OTP
  // -------------------------------------------------------------

  const verifyOtp = async (
    email: string,
    otp: string
  ) => {
    await api.verifyOtp({
      email,
      otp,
    });

    showToast(
      'Account verified successfully! You can now sign in.',
      'success'
    );

    setAuthModalMode('login');
  };

  // -------------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------------

  const logout = () => {
    clearStoredUser();
    setCurrentUser(null);

    showToast(
      'You have been signed out.',
      'info'
    );
  };

  // -------------------------------------------------------------
  // UPDATE PROFILE
  // -------------------------------------------------------------

  const updateProfile = async (
    data: Partial<User>
  ): Promise<User> => {
    /*
     * IMPORTANT:
     * The backend profile response does NOT contain the JWT token.
     *
     * Therefore we must preserve the existing authenticated user
     * and merge the updated profile information into it.
     */

    const existingUser =
      getStoredUser() || currentUser;

    if (!existingUser?.token) {
      throw new Error(
        'Your session has expired. Please sign in again.'
      );
    }

    const updatedProfile =
      await api.updateProfile(data);

    /*
     * Keep the original token.
     *
     * Also keep any fields that the backend doesn't return.
     */
    const updatedUser: User = {
      ...existingUser,
      ...updatedProfile,
      token: existingUser.token,
    };

    // Update React state
    setCurrentUser(updatedUser);

    // Persist the updated profile while preserving JWT
    saveStoredUser(updatedUser);

    showToast(
      'Profile updated successfully.',
      'success'
    );

    return updatedUser;
  };

  // -------------------------------------------------------------
  // CHANGE PASSWORD
  // -------------------------------------------------------------

  const changePassword = async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    await api.changePassword(payload);

    showToast(
      'Password changed successfully.',
      'success'
    );
  };

  // -------------------------------------------------------------
  // DELETE ACCOUNT
  // -------------------------------------------------------------

  const deleteAccount = async () => {
    await api.deleteProfile();

    clearStoredUser();
    setCurrentUser(null);

    showToast(
      'Your account has been deleted.',
      'info'
    );
  };

  // -------------------------------------------------------------
  // REFRESH PROFILE
  // -------------------------------------------------------------

  const refreshProfile = async () => {
    const existingUser =
      getStoredUser() || currentUser;

    if (!existingUser?.token) {
      return;
    }

    try {
      const profile = await api.getProfile();

      if (profile) {
        /*
         * Preserve JWT while refreshing profile.
         */
        const merged: User = {
          ...existingUser,
          ...profile,
          token: existingUser.token,
        };

        setCurrentUser(merged);
        saveStoredUser(merged);
      }
    } catch (error: any) {
      /*
       * Do not clear the session here unless the API
       * explicitly reports that the token is invalid.
       *
       * This prevents harmless profile refresh errors
       * from logging the user out.
       */
      if (error?.status === 401) {
        clearStoredUser();
        setCurrentUser(null);
      }
    }
  };

  // -------------------------------------------------------------
  // AUTH STATE
  // -------------------------------------------------------------

  const isAdmin =
    currentUser?.role === 'ADMIN';

  const isAuthenticated =
    !!currentUser?.token;

  // -------------------------------------------------------------
  // PROVIDER
  // -------------------------------------------------------------

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
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return ctx;
}
