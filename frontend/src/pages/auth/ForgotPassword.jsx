import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/authApi';
import { validateEmail } from '../../utils/validators';
import ErrorBanner from '../../components/ui/ErrorBanner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
    } catch {
      // Always show success — security best practice (prevents email enumeration)
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (error) setError(null);
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col items-center justify-center font-sans antialiased text-[#000926] bg-gradient-to-tr from-[#000926] via-[#051636] to-[#0F52BA] p-4">
      <main className="w-full max-w-[400px] flex flex-col items-center select-none">
        {/* Logo */}
        <div className="w-full flex items-center justify-center gap-2 mb-6">
          <span className="material-symbols-outlined text-[32px] font-fill-1 text-white animate-pulse">bolt</span>
          <span className="font-h1 text-[26px] font-extrabold tracking-tight text-white">Preparation Mate</span>
        </div>

        {/* Card */}
        <div className="w-full bg-white/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] p-6 sm:p-8 flex flex-col items-center relative overflow-hidden text-left">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          {!submitted ? (
            <>
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-[24px]">lock_reset</span>
              </div>

              {/* Heading */}
              <div className="text-center mb-6 w-full">
                <h2 className="text-lg font-bold text-[#000926] mb-1 leading-tight">Forgot your password?</h2>
                <p className="text-xs text-[#5B6775] font-semibold">Enter your email and we'll send you a reset link.</p>
              </div>

              {/* Form */}
              <form className="w-full space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider block" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`w-full h-10 px-3 bg-white/70 border rounded-lg text-sm font-semibold transition-all duration-200 focus:ring-2 focus:ring-primary/20 outline-none ${
                      error ? 'border-red-500 focus:ring-red-500/20' : 'border-primary-fixed-dim focus:border-primary'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[42px] bg-primary hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 text-sm mt-2"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                  {!loading && <span className="material-symbols-outlined text-base">arrow_forward</span>}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success Icon */}
              <div className="w-12 h-12 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#16A34A] text-[24px]">mark_email_read</span>
              </div>

              <h2 className="text-lg font-bold text-[#000926] text-center mb-1 leading-tight">Check your inbox</h2>
              <p className="text-xs text-[#5B6775] text-center font-semibold max-w-[300px] mb-6 leading-relaxed">
                If an account exists for this email, a password reset link has been sent.
              </p>

              <button
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Use a different email
              </button>
            </>
          )}

          {/* Back to login */}
          <Link
            className="mt-6 flex items-center gap-1.5 text-[#5B6775] hover:text-[#000926] transition-colors text-xs font-bold self-center"
            to="/login"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to login
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
