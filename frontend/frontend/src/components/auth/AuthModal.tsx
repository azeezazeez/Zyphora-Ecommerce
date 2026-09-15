import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

export function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register, verifyOtp } =
    useAuth();
  const { showToast } = useToast();

  // Internal view override for sub-steps (e.g. verify-otp, reset-password)
  const [activeView, setActiveView] = useState<'login' | 'register' | 'forgot' | 'verify-otp' | 'reset-password'>(
    authModalMode
  );

  // Synchronize when parent modal mode opens
  React.useEffect(() => {
    setActiveView(authModalMode);
  }, [authModalMode, authModalOpen]);

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const resetFields = () => {
    setErrorMsg(null);
    setPassword('');
    setConfirmPassword('');
    setOtp('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // login method automatically handles toast and closeAuthModal
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials or unverified account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        username: username.trim(),
        password,
        confirmPassword,
      });
      showToast('Registration initiated! Enter the OTP sent to your email.', 'info');
      setActiveView('verify-otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!otp.trim()) {
      setErrorMsg('Please enter the OTP verification code.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyOtp(email.trim(), otp.trim());
      setActiveView('login');
      resetFields();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg('Please provide your registered email address.');
      return;
    }

    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
      showToast('Password reset code sent to your email.', 'info');
      setActiveView('reset-password');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to send reset code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword: password,
        confirmPassword,
      });
      showToast('Password reset successfully! You can now sign in.', 'success');
      setActiveView('login');
      resetFields();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={closeAuthModal}
    >
      <div
        className="relative bg-white rounded-2xl border border-[#E1E5E9] max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center mx-auto shadow-xs">
            Z
          </div>
          <h2 className="text-xl font-bold text-[#17202A] tracking-tight pt-2">
            {activeView === 'login' && 'Sign in to Zyphora'}
            {activeView === 'register' && 'Create Your Zyphora Account'}
            {activeView === 'verify-otp' && 'Verify Your Email'}
            {activeView === 'forgot' && 'Reset Your Password'}
            {activeView === 'reset-password' && 'Set New Password'}
          </h2>
          <p className="text-xs text-[#5F6368]">
            {activeView === 'login' && 'Access your wishlist, orders, and saved addresses'}
            {activeView === 'register' && 'Join the premium marketplace for exclusive items'}
            {activeView === 'verify-otp' && `Enter the OTP sent to ${email || 'your email'}`}
            {activeView === 'forgot' && 'We will send a one-time reset code to your email'}
            {activeView === 'reset-password' && 'Enter the OTP and your new secure password'}
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* --- 1. LOGIN VIEW --- */}
        {activeView === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#17202A] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-[#17202A]">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    resetFields();
                    setActiveView('forgot');
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="auth-login-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <span className="text-[#5F6368]">Don't have an account? </span>
              <button
                type="button"
                onClick={() => {
                  resetFields();
                  setActiveView('register');
                }}
                className="font-bold text-indigo-600 hover:underline"
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* --- 2. REGISTER VIEW --- */}
        {activeView === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#17202A] mb-1">Full Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex_rivera"
                  className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#17202A] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#17202A] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-9 pr-9 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#17202A] mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              id="auth-register-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Create Account'}
            </button>

            <div className="text-center pt-2">
              <span className="text-[#5F6368]">Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  resetFields();
                  setActiveView('login');
                }}
                className="font-bold text-indigo-600 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* --- 3. OTP VERIFICATION VIEW --- */}
        {activeView === 'verify-otp' && (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4 text-xs">
            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-indigo-900">
                A 6-digit confirmation code was sent to <strong>{email}</strong>.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#17202A] mb-1">Enter OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] text-lg font-mono py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="text-xs text-[#5F6368] hover:text-[#17202A]"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* --- 4. FORGOT PASSWORD VIEW --- */}
        {activeView === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#17202A] mb-1">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A9199] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Sending Code...' : 'Send Reset Code'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="text-xs text-[#5F6368] hover:text-[#17202A]"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* --- 5. RESET PASSWORD VIEW --- */}
        {activeView === 'reset-password' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-[#17202A] mb-1">OTP Code</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#17202A] mb-1">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#17202A] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E1E5E9] rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="text-xs text-[#5F6368] hover:text-[#17202A]"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
