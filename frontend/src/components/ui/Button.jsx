import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white premium-btn-primary hover:shadow-lg hover:shadow-primary/25 active:scale-95 duration-200 transition-all',
    secondary: 'bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed-variant border border-primary-fixed-dim/60 hover:-translate-y-0.5 active:scale-95 duration-200 transition-all',
    ghost: 'bg-transparent hover:bg-primary-fixed/30 text-on-primary-fixed-variant active:scale-95 duration-200 transition-all',
    danger: 'bg-danger hover:bg-[#b22218] text-white hover:shadow-lg hover:shadow-danger/25 active:scale-95 duration-200 transition-all',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const classes = `${baseStyle} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
