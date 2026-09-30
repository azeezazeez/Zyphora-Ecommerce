import React, { useEffect, useState } from 'react';
import {
  Mail,
  X,
  Loader2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OTP_RESEND_SECONDS = 60;

export function AuthModal() {
  const {
    authModalOpen,
    closeAuthModal,
    requestEmailOtp,
    verifyEmailOtp,
  } = useAuth();

  // ============================================================
  // EMAIL LOGIN STATE
  // ============================================================

  const [email, setEmail] = useState('');

  const [otp, setOtp] = useState('');

  const [emailSubmitting, setEmailSubmitting] =
    useState(false);

  const [otpSubmitting, setOtpSubmitting] =
    useState(false);

  const [resendSubmitting, setResendSubmitting] =
    useState(false);

  const [googleSubmitting, setGoogleSubmitting] =
    useState(false);

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  const [otpStep, setOtpStep] =
    useState(false);

  // ============================================================
  // RESEND OTP COUNTDOWN
  // ============================================================

  const [resendCountdown, setResendCountdown] =
    useState(0);

  // ============================================================
  // RESET STATE WHEN MODAL OPENS
  // ============================================================

  useEffect(() => {
    if (authModalOpen) {
      setGoogleSubmitting(false);
      setEmailSubmitting(false);
      setOtpSubmitting(false);
      setResendSubmitting(false);
      setErrorMsg(null);
      setOtp('');
      setOtpStep(false);
      setResendCountdown(0);
    }
  }, [authModalOpen]);

  // ============================================================
  // OTP RESEND COUNTDOWN TIMER
  // ============================================================

  useEffect(() => {
    if (!otpStep || resendCountdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [otpStep, resendCountdown]);

  // ============================================================
  // BROWSER BACK / TAB FOCUS
  // ============================================================

  useEffect(() => {
    const handlePageShow = () => {
      setGoogleSubmitting(false);
      setEmailSubmitting(false);
      setOtpSubmitting(false);
      setResendSubmitting(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setGoogleSubmitting(false);
        setEmailSubmitting(false);
        setOtpSubmitting(false);
        setResendSubmitting(false);
      }
    };

    const handleFocus = () => {
      setGoogleSubmitting(false);
    };

    window.addEventListener(
      'pageshow',
      handlePageShow
    );

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    window.addEventListener(
      'focus',
      handleFocus
    );

    return () => {
      window.removeEventListener(
        'pageshow',
        handlePageShow
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      window.removeEventListener(
        'focus',
        handleFocus
      );
    };
  }, []);

  if (!authModalOpen) {
    return null;
  }

  // ============================================================
  // EMAIL → REQUEST OTP
  // ============================================================

  const handleEmailContinue = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setErrorMsg(null);

    const normalizedEmail =
      email.trim().toLowerCase();

    // ----------------------------------------------------------
    // VALIDATE EMAIL
    // ----------------------------------------------------------

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      setErrorMsg(
        'Please enter a valid email address.'
      );

      return;
    }

    setEmailSubmitting(true);

    try {
      // --------------------------------------------------------
      // REQUEST OTP
      // --------------------------------------------------------

      await requestEmailOtp(
        normalizedEmail
      );

      // --------------------------------------------------------
      // SWITCH TO OTP SCREEN
      // --------------------------------------------------------

      setEmail(normalizedEmail);

      setOtp('');

      setOtpStep(true);

      setErrorMsg(null);

      // --------------------------------------------------------
      // START 60 SECOND RESEND COUNTDOWN
      // --------------------------------------------------------

      setResendCountdown(
        OTP_RESEND_SECONDS
      );

    } catch (err: any) {
      console.error(
        '[Zyphora Auth] Email OTP request failed:',
        err
      );

      setErrorMsg(
        err?.message ||
          'Unable to send verification OTP. Please try again.'
      );
    } finally {
      setEmailSubmitting(false);
    }
  };

  // ============================================================
  // VERIFY OTP
  // ============================================================

  const handleVerifyOtp = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setErrorMsg(null);

    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedOtp =
      otp.replace(/\D/g, '');

    // ----------------------------------------------------------
    // VALIDATE OTP
    // ----------------------------------------------------------

    if (!normalizedOtp) {
      setErrorMsg(
        'Please enter the verification OTP.'
      );

      return;
    }

    if (normalizedOtp.length !== 6) {
      setErrorMsg(
        'OTP must be exactly 6 digits.'
      );

      return;
    }

    setOtpSubmitting(true);

    try {
      // --------------------------------------------------------
      // VERIFY OTP
      // --------------------------------------------------------

      await verifyEmailOtp(
        normalizedEmail,
        normalizedOtp
      );

    } catch (err: any) {
      console.error(
        '[Zyphora Auth] Email OTP verification failed:',
        err
      );

      setErrorMsg(
        err?.message ||
          'Invalid or expired OTP. Please try again.'
      );
    } finally {
      setOtpSubmitting(false);
    }
  };

  // ============================================================
  // RESEND OTP
  // ============================================================

  const handleResendOtp = async () => {
    if (
      resendSubmitting ||
      otpSubmitting ||
      resendCountdown > 0
    ) {
      return;
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      setErrorMsg(
        'Please enter a valid email address.'
      );

      return;
    }

    setResendSubmitting(true);
    setErrorMsg(null);

    try {
      // --------------------------------------------------------
      // REQUEST A NEW OTP
      // --------------------------------------------------------

      await requestEmailOtp(
        normalizedEmail
      );

      // --------------------------------------------------------
      // CLEAR OLD OTP
      // --------------------------------------------------------

      setOtp('');

      // --------------------------------------------------------
      // RESTART COUNTDOWN
      // --------------------------------------------------------

      setResendCountdown(
        OTP_RESEND_SECONDS
      );

      setErrorMsg(null);

    } catch (err: any) {
      console.error(
        '[Zyphora Auth] OTP resend failed:',
        err
      );

      const message =
        err?.message ||
        'Unable to resend OTP. Please try again.';

      setErrorMsg(message);

      // --------------------------------------------------------
      // HANDLE BACKEND COOLDOWN MESSAGE
      //
      // Example:
      // "Please wait 43 seconds before requesting another OTP"
      // --------------------------------------------------------

      const match =
        message.match(
          /Please wait\s+(\d+)\s+seconds?/i
        );

      if (match) {
        const remainingSeconds =
          Number(match[1]);

        if (
          Number.isFinite(
            remainingSeconds
          ) &&
          remainingSeconds > 0
        ) {
          setResendCountdown(
            remainingSeconds
          );
        }
      }

    } finally {
      setResendSubmitting(false);
    }
  };

  // ============================================================
  // CHANGE EMAIL
  // ============================================================

  const handleChangeEmail = () => {
    setOtpStep(false);
    setOtp('');
    setErrorMsg(null);
    setResendCountdown(0);
    setResendSubmitting(false);
  };

  // ============================================================
  // GOOGLE OAUTH
  // ============================================================

  const handleGoogleContinue = (
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setErrorMsg(null);
    setGoogleSubmitting(true);

    const timer = setTimeout(() => {
      setGoogleSubmitting(false);
    }, 8000);

    try {
      window.location.href =
        'https://zyphora-ecommerce.onrender.com/api/auth/google';
    } catch {
      clearTimeout(timer);

      setGoogleSubmitting(false);

      setErrorMsg(
        'Unable to connect to Google. Please try again.'
      );
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        bg-black/60
        backdrop-blur-xs
        flex
        items-center
        justify-center
        p-4
        animate-in
        fade-in
        duration-200
      "
      onClick={closeAuthModal}
    >
      <div
        className="
          relative
          bg-white
          rounded-2xl
          border
          border-[#E1E5E9]
          max-w-md
          w-full
          p-6
          sm:p-8
          shadow-2xl
          animate-in
          zoom-in-95
          duration-200
        "
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* ================================================== */}
        {/* CLOSE BUTTON                                      */}
        {/* ================================================== */}

        <button
          type="button"
          onClick={closeAuthModal}
          className="
            absolute
            top-4
            right-4
            p-1.5
            rounded-full
            text-slate-400
            hover:text-slate-700
            hover:bg-slate-100
            transition-colors
          "
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ================================================== */}
        {/* OTP VERIFICATION SCREEN                           */}
        {/* ================================================== */}

        {otpStep ? (
          <div>

            {/* ==================================================
                HEADER
                ================================================== */}

            <div className="text-center space-y-2 mb-6">

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-purple-600
                  text-white
                  flex
                  items-center
                  justify-center
                  mx-auto
                  shadow-xs
                "
              >
                <ShieldCheck className="w-6 h-6" />
              </div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-[#17202A]
                "
              >
                Verify your email
              </h2>

              <p
                className="
                  text-xs
                  text-[#5F6368]
                  leading-relaxed
                "
              >
                We sent a 6-digit verification
                code to
                <br />

                <span
                  className="
                    font-semibold
                    text-[#17202A]
                  "
                >
                  {email}
                </span>
              </p>

            </div>

            {/* ==================================================
                ERROR
                ================================================== */}

            {errorMsg && (
              <div
                className="
                  mb-4
                  p-3
                  bg-rose-50
                  border
                  border-rose-200
                  rounded-xl
                  text-xs
                  text-rose-800
                  font-semibold
                "
              >
                {errorMsg}
              </div>
            )}

            {/* ==================================================
                OTP FORM
                ================================================== */}

            <form
              onSubmit={handleVerifyOtp}
              className="space-y-4"
            >

              {/* OTP INPUT */}

              <div>

                <label
                  htmlFor="auth-email-otp"
                  className="
                    block
                    text-xs
                    font-semibold
                    text-[#17202A]
                    mb-1.5
                  "
                >
                  Verification Code
                </label>

                <input
                  id="auth-email-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const value =
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6);

                    setOtp(value);

                    if (errorMsg) {
                      setErrorMsg(null);
                    }
                  }}
                  placeholder="Enter 6-digit OTP"
                  autoFocus
                  disabled={
                    otpSubmitting ||
                    resendSubmitting
                  }
                  className="
                    w-full
                    px-4
                    py-3
                    text-center
                    text-lg
                    font-bold
                    tracking-[0.35em]
                    bg-[#F8F9FA]
                    border
                    border-[#E1E5E9]
                    rounded-lg
                    focus:outline-none
                    focus:border-purple-600
                    focus:bg-white
                    transition-colors
                    text-[#17202A]
                    disabled:opacity-60
                  "
                />

              </div>

              {/* ==================================================
                  VERIFY BUTTON
                  ================================================== */}

              <button
                id="auth-email-verify-btn"
                type="submit"
                disabled={
                  otpSubmitting ||
                  resendSubmitting ||
                  otp.length !== 6
                }
                className="
                  w-full
                  py-2.5
                  bg-purple-600
                  hover:bg-purple-700
                  text-white
                  font-bold
                  rounded-lg
                  transition-colors
                  shadow-xs
                  flex
                  items-center
                  justify-center
                  gap-2
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {otpSubmitting ? (
                  <>
                    <Loader2
                      className="
                        w-4
                        h-4
                        animate-spin
                      "
                    />

                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>

            </form>

            {/* ==================================================
                RESEND OTP
                ================================================== */}

            <div
              className="
                mt-5
                text-center
              "
            >

              {resendCountdown > 0 ? (
                <p
                  className="
                    text-xs
                    text-[#6B7280]
                  "
                >
                  Didn't receive the code?

                  <span
                    className="
                      ml-1
                      font-semibold
                      text-[#17202A]
                    "
                  >
                    Resend OTP in{' '}
                    {resendCountdown}s
                  </span>
                </p>
              ) : (
                <div
                  className="
                    flex
                    items-center
                    justify-center
                    gap-1.5
                    text-xs
                  "
                >
                  <span
                    className="
                      text-[#6B7280]
                    "
                  >
                    Didn't receive the code?
                  </span>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={
                      resendSubmitting ||
                      otpSubmitting
                    }
                    className="
                      font-semibold
                      text-purple-600
                      hover:text-purple-800
                      transition-colors
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      inline-flex
                      items-center
                      gap-1
                    "
                  >
                    {resendSubmitting ? (
                      <>
                        <Loader2
                          className="
                            w-3.5
                            h-3.5
                            animate-spin
                          "
                        />

                        Sending...
                      </>
                    ) : (
                      'Resend OTP'
                    )}
                  </button>
                </div>
              )}

            </div>

            {/* ==================================================
                CHANGE EMAIL
                ================================================== */}

            <div className="mt-4 text-center">

              <button
                type="button"
                onClick={handleChangeEmail}
                disabled={
                  otpSubmitting ||
                  resendSubmitting
                }
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  text-xs
                  font-semibold
                  text-purple-600
                  hover:text-purple-800
                  transition-colors
                  disabled:opacity-50
                "
              >
                <ArrowLeft className="w-3.5 h-3.5" />

                Change email
              </button>

            </div>

            {/* ==================================================
                OTP INFORMATION
                ================================================== */}

            <p
              className="
                text-[11px]
                text-center
                text-[#8A9199]
                mt-4
                leading-relaxed
              "
            >
              The verification code expires in
              5 minutes.
            </p>

          </div>

        ) : (

          /* ================================================= */
          /* INITIAL LOGIN SCREEN                             */
          /* ================================================= */

          <div>

            {/* ==================================================
                HEADER
                ================================================== */}

            <div
              className="
                text-center
                space-y-2
                mb-6
              "
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-purple-600
                  text-white
                  font-black
                  text-lg
                  flex
                  items-center
                  justify-center
                  mx-auto
                  shadow-xs
                "
              >
                Z
              </div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-[#17202A]
                "
              >
                Login or Sign up
              </h2>

              <p
                className="
                  text-xs
                  text-[#5F6368]
                "
              >
                Continue with Google or verify
                your email with a one-time password.
              </p>

            </div>

            {/* ==================================================
                ERROR
                ================================================== */}

            {errorMsg && (
              <div
                className="
                  mb-4
                  p-3
                  bg-rose-50
                  border
                  border-rose-200
                  rounded-xl
                  text-xs
                  text-rose-800
                  font-semibold
                "
              >
                {errorMsg}
              </div>
            )}

            {/* ==================================================
                GOOGLE LOGIN
                ================================================== */}

            <button
              type="button"
              onClick={handleGoogleContinue}
              disabled={
                googleSubmitting ||
                emailSubmitting
              }
              className="
                w-full
                h-11
                px-4
                bg-white
                hover:bg-[#F8F9FA]
                active:bg-[#F1F3F4]
                border
                border-[#DADCE0]
                hover:border-[#C6C9CE]
                text-[#3C4043]
                font-medium
                text-sm
                rounded-lg
                transition-all
                duration-150
                flex
                items-center
                justify-center
                gap-3
                shadow-[0_1px_2px_0_rgba(60,64,67,0.08),0_1px_3px_1px_rgba(60,64,67,0.06)]
                hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.12),0_2px_6px_2px_rgba(60,64,67,0.08)]
                disabled:opacity-50
                disabled:cursor-not-allowed
                disabled:shadow-none
              "
            >
              {googleSubmitting ? (
                <>
                  <Loader2
                    className="
                      w-4
                      h-4
                      animate-spin
                      text-[#5F6368]
                    "
                  />

                  <span
                    className="
                      text-[#3C4043]
                      font-medium
                      text-sm
                    "
                  >
                    Connecting...
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="
                      w-4.5
                      h-4.5
                      shrink-0
                    "
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />

                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />

                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />

                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>

                  <span>
                    Continue with Google
                  </span>
                </>
              )}
            </button>

            {/* ==================================================
                DIVIDER
                ================================================== */}

            <div
              className="
                flex
                items-center
                gap-3
                my-5
              "
            >

              <div
                className="
                  h-px
                  bg-[#E1E5E9]
                  flex-1
                "
              />

              <span
                className="
                  text-[11px]
                  text-[#8A9199]
                  font-semibold
                  tracking-wider
                "
              >
                OR
              </span>

              <div
                className="
                  h-px
                  bg-[#E1E5E9]
                  flex-1
                "
              />

            </div>

            {/* ==================================================
                EMAIL OTP FORM
                ================================================== */}

            <form
              onSubmit={handleEmailContinue}
              className="space-y-3.5"
            >

              <div>

                <label
                  className="
                    block
                    text-xs
                    font-semibold
                    text-[#17202A]
                    mb-1.5
                  "
                >
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    className="
                      w-4
                      h-4
                      text-[#8A9199]
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                    "
                  />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(
                        e.target.value
                      );

                      if (errorMsg) {
                        setErrorMsg(null);
                      }
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={
                      emailSubmitting ||
                      googleSubmitting
                    }
                    className="
                      w-full
                      pl-9
                      pr-3
                      py-2.5
                      text-sm
                      bg-[#F8F9FA]
                      border
                      border-[#E1E5E9]
                      rounded-lg
                      focus:outline-none
                      focus:border-purple-600
                      focus:bg-white
                      transition-colors
                      text-[#17202A]
                      disabled:opacity-60
                    "
                  />

                </div>

              </div>

              {/* ==================================================
                  CONTINUE BUTTON
                  ================================================== */}

              <button
                id="auth-email-continue-btn"
                type="submit"
                disabled={
                  googleSubmitting ||
                  emailSubmitting
                }
                className="
                  w-full
                  py-2.5
                  bg-purple-600
                  hover:bg-purple-700
                  text-white
                  font-bold
                  rounded-lg
                  transition-colors
                  shadow-xs
                  flex
                  items-center
                  justify-center
                  gap-2
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {emailSubmitting ? (
                  <>
                    <Loader2
                      className="
                        w-4
                        h-4
                        animate-spin
                      "
                    />

                    Sending OTP...
                  </>
                ) : (
                  'Continue with Email'
                )}
              </button>

            </form>

            {/* ==================================================
                FOOTER
                ================================================== */}

            <p
              className="
                text-[11px]
                text-center
                text-[#8A9199]
                mt-5
                leading-relaxed
              "
            >
              By continuing, you agree to our
              Terms of Use and Privacy Policy.
            </p>

          </div>
        )}

      </div>
    </div>
  );
}
