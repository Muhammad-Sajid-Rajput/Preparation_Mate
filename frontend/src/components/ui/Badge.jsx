import React from 'react';

const Badge = ({ variant = 'brand', children, className = '', ...props }) => {
  const styles = {
    brand: 'bg-primary/10 text-primary border border-primary-fixed-dim/30',
    success: 'bg-success-light/45 text-success border border-success/15',
    warning: 'bg-warning-light/45 text-warning border border-warning/15',
    danger: 'bg-danger-light/45 text-danger border border-danger/15',
    gray: 'bg-primary-fixed-dim/30 text-on-primary-fixed-variant border border-primary-fixed-dim/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
