import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#000926]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative bg-white/95 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all border border-[#D6E6F3] flex flex-col max-h-[90vh] ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D6E6F3]">
          <h3 className="text-sm font-bold text-[#000926]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[#5B6775]/70 hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary-fixed/30"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
