import React, { useState, useEffect } from 'react';

const ErrorBanner = ({ message, onRetry, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      setIsAnimatingOut(false);

      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setVisible(false);
      if (onDismiss) onDismiss();
    }, 450); // Matches the 0.45s slideOutRight animation duration
  };

  if (!message || !visible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] flex items-start gap-3 bg-[#FEF2F2] border border-red-200 border-l-4 border-l-red-600 rounded-r-lg p-3.5 shadow-xl max-w-[320px] sm:max-w-[400px] select-none ${
        isAnimatingOut ? 'animate-slide-out' : 'animate-slide-in'
      }`}
    >
      <span className="text-xs font-bold text-danger leading-relaxed flex-1">
        {message}
      </span>
      <div className="flex items-center gap-3 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-extrabold text-danger underline hover:text-danger/80 transition-colors"
          >
            Retry
          </button>
        )}
        <button
          onClick={handleClose}
          className="text-xs font-bold text-danger/60 hover:text-danger transition-colors p-1"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ErrorBanner;
