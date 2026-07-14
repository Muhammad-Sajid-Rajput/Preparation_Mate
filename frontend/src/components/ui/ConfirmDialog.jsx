import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const ConfirmDialog = ({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel();
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#000926]/40 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div
        className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-[#D6E6F3] flex flex-col p-6 font-sans select-none"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D6E6F3]">
          <h3 className="text-base font-bold text-[#000926]">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-[#5B6775]/70 hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary-fixed/30"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 text-left">
          <p className="text-xs font-semibold text-[#5B6775] leading-relaxed">
            {body}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D6E6F3]">
          <button
            onClick={onCancel}
            className="h-[34px] px-4 border border-primary-fixed-dim/80 text-[#5B6775] font-bold rounded-lg hover:bg-primary-fixed/20 transition-all text-xs"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`h-[34px] px-4 text-white font-bold rounded-lg transition-all active:scale-[0.98] text-xs ${
              danger
                ? 'bg-error hover:bg-red-700'
                : 'bg-primary hover:bg-opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
