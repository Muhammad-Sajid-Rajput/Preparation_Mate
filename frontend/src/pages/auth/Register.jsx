import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validators';
import { ROUTES } from '../../constants/routes';
import ErrorBanner from '../../components/ui/ErrorBanner';
import * as authApi from '../../api/authApi';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const { register, verifyEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  // Strength meter (0-4 segments filled) computed on render
  let strength = 0;
  if (password.length > 0) strength = 1;
  if (password.length > 3) strength = 2;
  if (password.length > 7) strength = 3;
  if (password.length > 10 && /\d/.test(password)) strength = 4;

  const validateStep1 = () => {
    const errs = {};
    const emailErr = validateEmail(email);

    if (!fullName.trim()) errs.name = 'Full name is required';
    if (emailErr) errs.email = emailErr;

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    const passErr = validatePassword(password);

    if (passErr) errs.password = passErr;
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs = {};
    if (confirmationCode.trim().length !== 6) {
      errs.code = 'Please enter a valid 6-digit confirmation code';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setLoading(true);
      setApiError(null);
      try {
        await authApi.checkEmail(email);
        setStep(2);
      } catch (err) {
        if (err.response?.status === 409) {
          setApiError('An account with this email already exists.');
        } else {
          setApiError('Failed to verify email. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setApiError(null);
    const result = await register({
      name: fullName,
      email: email,
      password: password,
      goal: 'both', // default goal
    });
    setLoading(false);

    if (result.success) {
      setStep(3); // Advance to OTP step
    } else {
      setApiError(result.message);
    }
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    if (validateStep2()) {
      handleRegister();
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    if (validateStep3()) {
      setLoading(true);
      setApiError(null);
      const result = await verifyEmail(email, confirmationCode);
      setLoading(false);
      if (result.success) {
        navigate(ROUTES.LOGIN, { replace: true });
      } else {
        setApiError(result.message || 'Invalid or expired code. Please try again.');
      }
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      await authApi.resendOtp(email);
      setResendMsg('A new code has been sent to your email.');
    } catch {
      setResendMsg('Failed to resend. Please try again.');
    }
    setResending(false);
  };

  const handleFieldChange = (setter, field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setter(val);
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative flex flex-col items-center justify-center font-sans antialiased text-[#000926] bg-gradient-to-tr from-[#000926] via-[#051636] to-[#0F52BA] p-4 sm:p-8">
      {/* BRAND ABOVE THE CARD */}
      <div className="w-full max-w-4xl flex items-center justify-center gap-2 mb-6 px-4 sm:px-0 select-none">
        <span className="material-symbols-outlined text-[32px] font-fill-1 text-white animate-pulse">bolt</span>
        <span className="font-h1 text-[26px] font-extrabold tracking-tight text-white">Preparation Mate</span>
      </div>

      <div className="w-full max-w-4xl h-full max-h-[520px] flex bg-white/95 backdrop-blur-md rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] overflow-hidden relative border border-white/10">
        {/* LEFT COLUMN - 50% width */}
        <div
          className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
          style={{ backgroundImage: "url('/auth.webp')" }}
        >
          {/* Overlay gradient to blend */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000926]/80 via-transparent to-transparent"></div>
        </div>

        {/* RIGHT COLUMN - 50% width */}
        <div className="w-full lg:w-1/2 bg-white/90 h-full overflow-y-auto flex flex-col justify-center items-center p-6 sm:p-10 relative">
          {/* Back link - absolutely positioned top-right inside the column */}
          <Link to="/" className="absolute top-6 right-6 inline-flex items-center gap-1.5 text-[#5B6775] hover:text-[#000926] transition-colors text-xs font-bold z-50">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to home
          </Link>

          <div className="w-full max-w-[340px] flex flex-col">
            {/* Error Banner */}
            <ErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

            {/* Step 1: Name and Email */}
            {step === 1 && (
              <>
                <div className="mb-2 text-center">
                  <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed-variant rounded text-[10px] font-bold tracking-wide select-none">
                    Step 1 of 3
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-[#000926] mb-5 tracking-tight text-center">Personal Details</h2>

                <form className="space-y-3.5" onSubmit={handleStep1Submit}>
                  {/* Full name field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider block select-none" htmlFor="fullName">
                      Full name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="Muhammad Sajid"
                      value={fullName}
                      onChange={handleFieldChange(setFullName, 'name')}
                      className={`w-full h-10 px-3 bg-white/70 border rounded-lg text-sm font-semibold transition-all duration-200 focus:ring-2 focus:ring-primary/20 outline-none ${fieldErrors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-primary-fixed-dim focus:border-primary'
                        }`}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-red-500 font-bold">{fieldErrors.name}</p>
                    )}
                  </div>

                  {/* Email field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider block select-none" htmlFor="email">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={handleFieldChange(setEmail, 'email')}
                      className={`w-full h-10 px-3 bg-white/70 border rounded-lg text-sm font-semibold transition-all duration-200 focus:ring-2 focus:ring-primary/20 outline-none ${fieldErrors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-primary-fixed-dim focus:border-primary'
                        }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-500 font-bold">{fieldErrors.email}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full h-[42px] bg-primary hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] mt-6 text-sm"
                  >
                    Continue
                  </button>
                </form>

                <p className="text-center text-xs text-[#5B6775] font-semibold mt-6 select-none">
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}

            {/* Step 2: Passwords */}
            {step === 2 && (
              <>
                <div className="mb-2 text-center">
                  <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed-variant rounded text-[10px] font-bold tracking-wide select-none">
                    Step 2 of 3
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-[#000926] mb-5 tracking-tight text-center">Secure your account</h2>

                <form className="space-y-3.5" onSubmit={handleStep2Submit}>
                  {/* Password field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider block select-none" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={handleFieldChange(setPassword, 'password')}
                        className={`w-full h-10 px-3 pr-10 bg-white/70 border rounded-lg text-sm font-semibold transition-all duration-200 focus:ring-2 focus:ring-primary/20 outline-none ${fieldErrors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-primary-fixed-dim focus:border-primary'
                          }`}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6775] hover:text-[#000926] transition-colors flex items-center justify-center"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>

                    {/* Strength Meter */}
                    <div className="pt-1.5 text-left">
                      <div className="flex gap-1 h-[4px] mb-1">
                        <div
                          className={`flex-1 rounded-full transition-colors duration-300 ${strength >= 1
                            ? strength === 1
                              ? 'bg-error'
                              : strength === 2
                                ? 'bg-amber-500'
                                : 'bg-primary'
                            : 'bg-primary-fixed-dim/35'
                            }`}
                        ></div>
                        <div
                          className={`flex-1 rounded-full transition-colors duration-300 ${strength >= 2
                            ? strength === 2
                              ? 'bg-amber-500'
                              : 'bg-primary'
                            : 'bg-primary-fixed-dim/35'
                            }`}
                        ></div>
                        <div
                          className={`flex-1 rounded-full transition-colors duration-300 ${strength >= 3 ? 'bg-primary' : 'bg-primary-fixed-dim/35'
                            }`}
                        ></div>
                        <div
                          className={`flex-1 rounded-full transition-colors duration-300 ${strength >= 4 ? 'bg-primary' : 'bg-primary-fixed-dim/35'
                            }`}
                        ></div>
                      </div>
                      <span className="text-[11px] text-[#5B6775] font-semibold">Must be 8+ characters with a number</span>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-xs text-red-500 font-bold">{fieldErrors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider block select-none" htmlFor="confirmPassword">
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={handleFieldChange(setConfirmPassword, 'confirmPassword')}
                      className={`w-full h-10 px-3 bg-white/70 border rounded-lg text-sm font-semibold transition-all duration-200 focus:ring-2 focus:ring-primary/20 outline-none ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500/20' : 'border-primary-fixed-dim focus:border-primary'
                        }`}
                    />
                    {fieldErrors.confirmPassword && (
                      <p className="text-xs text-red-500 font-bold">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-[90px] h-[42px] border border-primary-fixed-dim/80 text-[#5B6775] font-bold rounded-lg hover:bg-primary-fixed/20 transition-all text-sm"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-[42px] bg-primary hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 text-white font-bold rounded-lg flex items-center justify-center transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {loading ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 3: Confirmation Code */}
            {step === 3 && (
              <>
                <div className="mb-2 text-center">
                  <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed-variant rounded text-[10px] font-bold tracking-wide select-none">
                    Step 3 of 3
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-[#000926] mb-2 tracking-tight text-center">Check your email</h2>
                <p className="text-xs text-[#5B6775] font-semibold mb-5 leading-relaxed">
                  We sent a 6-digit confirmation code to <span className="font-bold text-[#000926]">{email}</span>.
                </p>

                <form className="space-y-4" onSubmit={handleStep3Submit}>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider block select-none" htmlFor="confirmationCode">
                      Confirmation Code
                    </label>
                    <input
                      id="confirmationCode"
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={confirmationCode}
                      onChange={handleFieldChange(setConfirmationCode, 'code')}
                      className={`w-full h-11 text-center tracking-[0.5em] text-lg bg-white/70 border rounded-lg px-3 outline-none transition-all duration-200 focus:ring-2 focus:ring-primary/20 font-bold ${fieldErrors.code ? 'border-red-500 focus:ring-red-500/20' : 'border-primary-fixed-dim focus:border-primary'
                        }`}
                    />
                    {fieldErrors.code && (
                      <p className="text-xs text-red-500 font-bold text-center">{fieldErrors.code}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full h-[42px] bg-primary hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 text-white font-bold rounded-lg flex items-center justify-center transition-all duration-300 active:scale-[0.98] text-sm mt-4"
                  >
                    Verify
                  </button>
                </form>

                <p className="text-center text-xs text-[#5B6775] font-semibold mt-6 select-none">
                  Didn't receive a code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="font-bold text-primary hover:underline disabled:opacity-50"
                  >
                    {resending ? 'Sending...' : 'Resend'}
                  </button>
                </p>
                {resendMsg && (
                  <p className="text-center text-xs mt-2 text-green-600 font-bold">{resendMsg}</p>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
