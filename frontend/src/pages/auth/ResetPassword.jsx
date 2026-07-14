import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword, validateResetToken } from '../../api/authApi';
import { handleApiError } from '../../utils/handleApiError';
import { ROUTES } from '../../constants/routes';
import ErrorBanner from '../../components/ui/ErrorBanner';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tokenStatus, setTokenStatus] = useState('loading'); // 'loading', 'valid', 'invalid', 'expired', 'used'

  // Live password validation checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const getStrength = () => {
    if (!password) {
      return { label: '', color: 'bg-surface-container-high', score: 0, textClass: 'text-outline' };
    }
    
    let metCount = 0;
    if (hasMinLength) metCount++;
    if (hasUppercase) metCount++;
    if (hasLowercase) metCount++;
    if (hasNumber) metCount++;
    if (hasSpecial) metCount++;

    if (password.length < 8 || metCount <= 3) {
      return { label: 'Weak', color: 'bg-red-500', score: 1, textClass: 'text-red-500' };
    } else if (metCount === 4) {
      return { label: 'Medium', color: 'bg-amber-500', score: 2, textClass: 'text-amber-500' };
    } else {
      return { label: 'Strong', color: 'bg-green-500', score: 3, textClass: 'text-green-500' };
    }
  };

  const strengthInfo = getStrength();

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid');
      return;
    }

    const verifyToken = async () => {
      try {
        await validateResetToken(token);
        setTokenStatus('valid');
      } catch (err) {
        const errType = err.response?.data?.errorType || 'invalid';
        setTokenStatus(errType);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Perform submit-time validation
    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      setError('Password does not meet all security requirements.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      // Success redirection using proper routing structure
      navigate(ROUTES.PASSWORD_RESET_SUCCESS);
    } catch (err) {
      const formatted = handleApiError(err);
      if (formatted.status === 400 && err.response?.data?.errorType) {
        setTokenStatus(err.response.data.errorType);
      } else {
        setError(formatted.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderErrorState = (title, message) => {
    return (
      <div className="w-full bg-white/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] p-6 sm:p-8 flex flex-col items-center relative overflow-hidden">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-red-500 text-[24px]">link_off</span>
        </div>
        <div className="text-center mb-6 w-full">
          <h2 className="text-lg font-bold text-[#000926] mb-1.5 leading-tight">{title}</h2>
          <p className="text-xs text-[#5B6775] font-semibold px-2">{message}</p>
        </div>
        <div className="w-full space-y-3">
          <Link to={ROUTES.FORGOT_PASSWORD} className="block w-full">
            <button className="w-full h-[42px] bg-primary hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] text-sm">
              Request New Reset Link
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </Link>
          <Link to={ROUTES.LOGIN} className="block w-full text-center">
            <button className="w-full h-[42px] border border-primary-fixed-dim/80 text-[#5B6775] font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] text-sm hover:bg-primary-fixed/20">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Login
            </button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col items-center justify-center font-sans antialiased text-[#000926] bg-gradient-to-tr from-[#000926] via-[#051636] to-[#0F52BA] p-4">
      <main className="w-full max-w-[400px] flex flex-col items-center select-none">
        {/* Logo */}
        <div className="w-full flex items-center justify-center gap-2 mb-6">
          <span className="material-symbols-outlined text-[32px] font-fill-1 text-white animate-pulse">bolt</span>
          <span className="font-h1 text-[26px] font-extrabold tracking-tight text-white">Preparation Mate</span>
        </div>

        {/* Loading State */}
        {tokenStatus === 'loading' && (
          <div className="w-full bg-white/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] p-8 flex flex-col items-center justify-center min-h-[250px]">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-xs font-semibold text-[#5B6775]">Verifying security token...</p>
          </div>
        )}

        {/* Invalid Token State */}
        {tokenStatus === 'invalid' && renderErrorState(
          'Invalid password reset link.',
          'The security token provided is invalid or syntactically incorrect. Please verify the URL and try again.'
        )}

        {/* Expired Token State */}
        {tokenStatus === 'expired' && renderErrorState(
          'This password reset link has expired.',
          'For security, password reset links expire after 30 minutes. Please request a new one.'
        )}

        {/* Used Token State */}
        {tokenStatus === 'used' && renderErrorState(
          'This password reset link has already been used.',
          'This link has already been consumed to reset your password and is now invalidated.'
        )}

        {/* Form State */}
        {tokenStatus === 'valid' && (
          <div className="w-full bg-white/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] p-6 sm:p-8 flex flex-col items-center relative overflow-hidden text-left">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />

            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-[24px]">key</span>
            </div>

            <div className="text-center mb-6 w-full text-center">
              <h2 className="text-lg font-bold text-[#000926] mb-1 leading-tight">Create a new password</h2>
              <p className="text-xs text-[#5B6775] font-semibold">Choose a strong password to secure your account.</p>
            </div>

            <form className="w-full space-y-4" onSubmit={handleSubmit} noValidate>
              {/* New Password */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    aria-describedby="password-rules"
                    onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                    className="w-full h-10 px-3 bg-white/70 border border-primary-fixed-dim rounded-lg text-sm font-semibold transition-all duration-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6775] hover:text-[#000926] transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>

                {/* Strength meter and live criteria */}
                <div className="pt-2" id="password-rules">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-medium text-on-surface-variant">Password Strength</span>
                    <span className={`text-[11px] font-bold ${strengthInfo.textClass}`}>
                      {strengthInfo.label}
                    </span>
                  </div>
                  <div className="flex gap-1 h-[4px] mb-3">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-colors duration-300 ${
                          strengthInfo.score >= level ? strengthInfo.color : 'bg-surface-container-high'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Requirements checklist */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-outline">
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-[13px] font-bold ${hasMinLength ? 'text-green-600' : 'text-outline-variant'}`}>
                        {hasMinLength ? 'check' : 'radio_button_unchecked'}
                      </span>
                      <span>8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-[13px] font-bold ${hasUppercase ? 'text-green-600' : 'text-outline-variant'}`}>
                        {hasUppercase ? 'check' : 'radio_button_unchecked'}
                      </span>
                      <span>1 uppercase (A-Z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-[13px] font-bold ${hasLowercase ? 'text-green-600' : 'text-outline-variant'}`}>
                        {hasLowercase ? 'check' : 'radio_button_unchecked'}
                      </span>
                      <span>1 lowercase (a-z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-[13px] font-bold ${hasNumber ? 'text-green-600' : 'text-outline-variant'}`}>
                        {hasNumber ? 'check' : 'radio_button_unchecked'}
                      </span>
                      <span>1 number (0-9)</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <span className={`material-symbols-outlined text-[13px] font-bold ${hasSpecial ? 'text-green-600' : 'text-outline-variant'}`}>
                        {hasSpecial ? 'check' : 'radio_button_unchecked'}
                      </span>
                      <span>1 special char (!@#$%, etc.)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); if (error) setError(null); }}
                    className="w-full h-10 px-3 bg-white/70 border border-primary-fixed-dim rounded-lg text-sm font-semibold transition-all duration-200 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6775] hover:text-[#000926] transition-colors"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide Confirm Password' : 'Show Confirm Password'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                className="w-full h-[42px] bg-primary hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-sm mt-6"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Set new password'}
                {!loading && <span className="material-symbols-outlined text-base">arrow_forward</span>}
              </button>
            </form>

            <Link
              className="mt-6 flex items-center gap-1.5 text-[#5B6775] hover:text-[#000926] transition-colors text-xs font-bold w-full justify-center"
              to={ROUTES.LOGIN}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to login
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResetPassword;
