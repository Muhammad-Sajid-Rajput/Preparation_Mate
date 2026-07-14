import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword } from '../../utils/validators';
import { ROUTES } from '../../constants/routes';
import ErrorBanner from '../../components/ui/ErrorBanner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs = {};
    const emailErr = validateEmail(email);
    const passErr = !password ? 'Password is required' : null;
    if (emailErr) errs.email = emailErr;
    if (passErr) errs.password = passErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (errors.email) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (errors.password) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.password;
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    } else {
      setApiError(result.message);
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
            {/* H2 */}
            <h2 className="text-xl font-extrabold text-[#000926] mb-5 tracking-tight text-center">Sign in to your account</h2>

            {/* Error Banner */}
            <ErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block select-none" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`w-full h-10 px-3 bg-white/70 border rounded-lg text-sm font-semibold transition-all duration-200 focus:ring-2 focus:ring-primary/20 outline-none ${errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-primary-fixed-dim focus:border-primary'
                    }`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-bold">{errors.email}</p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider block select-none" htmlFor="password">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`w-full h-10 px-3 pr-10 bg-white/70 border rounded-lg text-sm font-semibold transition-all duration-200 focus:ring-2 focus:ring-primary/20 outline-none ${errors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-primary-fixed-dim focus:border-primary'
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
                {errors.password && (
                  <p className="text-xs text-red-500 font-bold">{errors.password}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[42px] bg-primary hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] mt-6 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Footer Text */}
            <p className="text-center text-xs text-[#5B6775] font-semibold mt-6 select-none">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-primary hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
