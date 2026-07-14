import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import Button from '../components/ui/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#D6E6F3]/50 via-white to-white px-4 py-12 font-sans antialiased text-on-surface">
      <div className="max-w-md w-full text-center premium-card space-y-8 !p-8 animate-fade-up">

        {/* Graphic */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-30" />
          <div className="relative w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-primary text-5xl font-fill-1">search_off</span>
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-3">
          <p className="text-7xl font-extrabold text-primary select-none leading-none tracking-tight">404</p>
          <h1 className="text-xl font-bold text-[#000926] tracking-tight">Page Not Found</h1>
          <p className="text-[#5B6775] text-xs font-semibold leading-relaxed max-w-xs mx-auto">
            The page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center select-none">
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            className="flex items-center gap-2 h-10 px-5 text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Go Back
          </Button>
          <Button
            onClick={() => navigate(ROUTES.HOME)}
            variant="primary"
            className="flex items-center gap-2 h-10 px-5 text-xs font-bold shadow-md shadow-primary/15"
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            Go Home
          </Button>
        </div>

        {/* Quick nav links */}
        <div className="pt-5 border-t border-[#D6E6F3] select-none">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B6775] mb-3">Or go directly to</p>
          <div className="flex gap-4 justify-center flex-wrap">
            {[
              { label: 'Dashboard', path: ROUTES.DASHBOARD },
              { label: 'Notes', path: ROUTES.NOTES },
              { label: 'Quizzes', path: ROUTES.QUIZZES },
              { label: 'AI Assistant', path: ROUTES.CHAT },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="text-xs font-bold text-primary hover:underline transition-all"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
