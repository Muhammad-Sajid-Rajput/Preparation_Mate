import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const PasswordResetSuccess = () => {
  return (
    <div className="h-screen w-full overflow-hidden flex flex-col items-center justify-center font-sans antialiased text-[#000926] bg-gradient-to-tr from-[#000926] via-[#051636] to-[#0F52BA] p-4">
      <main className="w-full max-w-[400px] flex flex-col items-center select-none">
        {/* Logo */}
        <div className="w-full flex items-center justify-center gap-2 mb-6">
          <span className="material-symbols-outlined text-[32px] font-fill-1 text-white animate-pulse">bolt</span>
          <span className="font-h1 text-[26px] font-extrabold tracking-tight text-white">Preparation Mate</span>
        </div>

        {/* Card */}
        <div className="w-full bg-white/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
          
          <div className="w-12 h-12 rounded-full bg-[#DCFCE7] flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[#16A34A] text-[24px]">check_circle</span>
          </div>
          
          <h2 className="text-lg font-bold text-[#000926] mb-1.5 leading-tight">
            Password changed successfully.
          </h2>
          
          <p className="text-xs text-[#5B6775] font-semibold mb-6 leading-relaxed max-w-[300px]">
            You can now sign in to your account with your new password.
          </p>

          <Link to={ROUTES.LOGIN} className="w-full">
            <button className="w-full h-[42px] bg-primary hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] text-sm">
              Sign In
              <span className="material-symbols-outlined text-base">login</span>
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PasswordResetSuccess;
