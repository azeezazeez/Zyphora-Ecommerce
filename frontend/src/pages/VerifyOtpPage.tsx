import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function VerifyOtpPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmailOtp, requestEmailOtp } = useAuth();
  const { showToast } = useToast();
  const email = (params.get('email') || '').trim().toLowerCase();
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) { setError('Email address is missing. Please return and try again.'); return; }
    if (!/^\d{6}$/.test(otp.trim())) { setError('Enter the 6-digit OTP sent to your email.'); return; }
    setSubmitting(true);
    try { await verifyEmailOtp(email, otp.trim()); navigate('/'); }
    catch (err: any) { setError(err.message || 'Invalid or expired OTP. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const resend = async () => {
    setError(null); setResending(true);
    try { await requestEmailOtp(email); showToast('A new verification OTP has been sent.', 'info'); }
    catch (err: any) { setError(err.message || 'Unable to resend OTP.'); }
    finally { setResending(false); }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E1E5E9] p-6 sm:p-8 shadow-sm">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto"><Mail className="w-6 h-6" /></div>
          <h1 className="text-xl font-bold text-[#17202A]">Verify your email</h1>
          <p className="text-xs text-[#5F6368]">Enter the 6-digit OTP sent to <span className="font-semibold text-[#17202A]">{email || 'your email'}</span>.</p>
        </div>
        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input autoFocus inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="w-full text-center tracking-[0.5em] text-xl font-bold py-3 bg-[#F8F9FA] border border-[#E1E5E9] rounded-xl focus:outline-none focus:border-indigo-600" />
          <button disabled={submitting} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <><CheckCircle2 className="w-4 h-4" /> Verify & Continue</>}
          </button>
        </form>
        <div className="mt-5 flex items-center justify-between text-xs">
          <Link to="/" className="text-[#5F6368] hover:text-[#17202A] flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back</Link>
          <button type="button" onClick={resend} disabled={resending || !email} className="font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50">{resending ? 'Sending...' : 'Resend OTP'}</button>
        </div>
      </div>
    </div>
  );
}
