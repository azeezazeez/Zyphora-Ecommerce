import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register, verifyOtp } = useAuth();
  const { showToast } = useToast();

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regOtp, setRegOtp] = useState('');
  const [regStep, setRegStep] = useState<'form' | 'otp'>('form');

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');

  // Loading and error states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!authModalOpen) return null;

  // Validation helpers for registration
  const isGmail = (email: string) => {
    if (!email.toLowerCase().endsWith('@gmail.com')) return false;
    const usernamePart = email.slice(0, -10);
    if (usernamePart.length < 1 || usernamePart.length > 30) return false;
    if (usernamePart.startsWith('.') || usernamePart.endsWith('.')) return false;
    if (usernamePart.includes('..')) return false;
    return /^[a-zA-Z0-9.]+$/.test(usernamePart);
  };

  const isUsernameValid = (username: string) => {
    return /^[a-zA-Z0-9._-]{3,30}$/.test(username);
  };

  const isPasswordValid = (password: string) => {
    if (password.length < 8 || password.length > 72) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUpper && hasLower && hasNumber && hasSpecial;
  };

  // Handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isGmail(regEmail.trim())) {
      setErrorMessage('Please use a valid Gmail address (e.g. name@gmail.com).');
      return;
    }
    if (!isUsernameValid(regUsername.trim())) {
      setErrorMessage('Username must be 3-30 characters (letters, numbers, dot, dash, underscore).');
      return;
    }
    if (!isPasswordValid(regPassword)) {
      setErrorMessage(
        'Password must be 8-72 characters with at least 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.'
      );
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email: regEmail.trim(),
        username: regUsername.trim(),
        password: regPassword,
        confirmPassword: regConfirmPassword,
      });
      showToast(`Verification OTP sent to ${regEmail.trim()}`, 'info');
      setRegStep('otp');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!regOtp.trim()) {
      setErrorMessage('Please enter the OTP code.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyOtp(regEmail.trim(), regOtp.trim());
      setRegStep('form');
      setLoginEmail(regEmail.trim());
      setLoginPassword(regPassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotGenerateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!forgotEmail.trim()) {
      setErrorMessage('Please provide your registered email address.');
      return;
    }

    setSubmitting(true);
    try {
      await api.forgotPasswordGenerateOtp(forgotEmail.trim());
      showToast(`OTP sent to ${forgotEmail.trim()}`, 'info');
      setForgotStep('reset');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to send OTP. Please verify your email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!forgotOtp.trim()) {
      setErrorMessage('Please enter the OTP code received.');
      return;
    }
    if (!isPasswordValid(forgotNewPassword)) {
      setErrorMessage('Password must meet security standards (8+ chars, upper, lower, number, symbol).');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.forgotPasswordReset({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword,
        confirmPassword: forgotConfirmPassword,
      });
      showToast('Password reset successfully! Please sign in with your new password.', 'success');
      setForgotStep('email');
      openAuthModal('login');
      setLoginEmail(forgotEmail.trim());
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset failed. Please check the OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white rounded-2xl border border-[#E1E5E9] shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#E1E5E9] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Zyphora Account</span>
            <h2 className="text-xl font-bold text-[#17202A]">
              {authModalMode === 'login' && 'Sign in to Zyphora'}
              {authModalMode === 'register' && (regStep === 'otp' ? 'Verify Your Email' : 'Create an Account')}
              {authModalMode === 'forgot' && (forgotStep === 'reset' ? 'Set New Password' : 'Reset Password')}
            </h2>
          </div>
          <button
            id="close-auth-modal"
            onClick={closeAuthModal}
            className="p-1 text-[#5F6368] hover:text-[#17202A] rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 pt-4">
          {/* LOGIN VIEW */}
          {authModalMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#17202A] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#17202A]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      openAuthModal('forgot');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password-input"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9199] hover:text-[#17202A]"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-[#5F6368]">Don't have a Zyphora account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    openAuthModal('register');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Create one now
                </button>
              </div>
            </form>
          )}

          {/* REGISTER VIEW */}
          {authModalMode === 'register' && (
            <div>
              {regStep === 'form' ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#17202A] mb-1">
                      Gmail Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-email-input"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="username@gmail.com"
                        className="w-full pl-9 pr-3 py-1.5 text-sm bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-[#5F6368] mt-0.5">Only @gmail.com addresses supported by backend</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17202A] mb-1">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-username-input"
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="3-30 chars, e.g. john_doe"
                        className="w-full pl-9 pr-3 py-1.5 text-sm bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17202A] mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-password-input"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 8 chars, 1 upper, 1 digit, 1 symbol"
                        className="w-full pl-9 pr-10 py-1.5 text-sm bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9199]"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17202A] mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-confirm-password-input"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-9 pr-3 py-1.5 text-sm bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    id="submit-register-btn"
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Creating account...' : 'Continue & Receive OTP'}
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-xs text-[#5F6368]">Already registered? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        openAuthModal('login');
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900 leading-relaxed">
                    We sent a 6-digit confirmation code to <strong>{regEmail}</strong>. Please enter the OTP below to activate your Zyphora account.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17202A] mb-1.5">Enter OTP Code</label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-otp-input"
                        type="text"
                        required
                        maxLength={10}
                        value={regOtp}
                        onChange={(e) => setRegOtp(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-9 pr-3 py-2 text-center tracking-widest text-lg font-bold bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    id="submit-verify-otp-btn"
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Verifying...' : 'Verify OTP & Activate'}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setRegStep('form')}
                      className="text-xs text-[#5F6368] hover:text-[#17202A]"
                    >
                      ← Back to edit email
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {authModalMode === 'forgot' && (
            <div>
              {forgotStep === 'email' ? (
                <form onSubmit={handleForgotGenerateOtp} className="space-y-4">
                  <p className="text-xs text-[#5F6368] leading-relaxed">
                    Enter your registered email address. We will generate and send an OTP to reset your password.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#17202A] mb-1.5">Registered Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="forgot-email-input"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Generating OTP...' : 'Send Reset Code'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotResetPassword} className="space-y-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900">
                    OTP sent to <strong>{forgotEmail}</strong>. Enter the OTP code and your new password.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17202A] mb-1">OTP Code</label>
                    <input
                      type="text"
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-3 py-1.5 text-sm bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17202A] mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="8+ chars, upper, lower, digit, symbol"
                      className="w-full px-3 py-1.5 text-sm bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17202A] mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-1.5 text-sm bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-xs disabled:opacity-50"
                  >
                    {submitting ? 'Resetting...' : 'Reset & Save Password'}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep('email')}
                      className="text-xs text-[#5F6368] hover:text-[#17202A]"
                    >
                      ← Re-enter email
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
