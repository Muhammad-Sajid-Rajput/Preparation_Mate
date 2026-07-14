import React from 'react';

const Input = ({
  label,
  error,
  helperText,
  id,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-primary uppercase tracking-wider block select-none">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`w-full h-10 px-3.5 bg-white/70 border rounded-lg text-sm font-semibold transition-all duration-200 outline-none
          ${error
            ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
            : 'border-primary-fixed-dim focus:border-primary focus:ring-2 focus:ring-primary/20'
          }
          text-[#000926] placeholder-[#5B6775]/50 disabled:bg-[#D6E6F3]/20 disabled:text-[#5B6775]/50`}
        {...props}
      />
      {error && (
        <p className="text-xs font-bold text-danger">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs font-semibold text-[#5B6775]">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
