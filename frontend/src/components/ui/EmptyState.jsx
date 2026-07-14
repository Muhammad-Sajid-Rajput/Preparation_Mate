import React from 'react';
import Button from './Button';

const EmptyState = ({
  icon: Icon,
  heading,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-primary-fixed-dim/60 rounded-2xl bg-white/70 backdrop-blur-md shadow-sm ${className}`}>
      {Icon && (
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-fixed/40 text-primary mb-4 border border-primary-fixed-dim/30">
          <Icon size={28} />
        </div>
      )}
      <h3 className="text-base font-extrabold text-on-surface mb-1">
        {heading}
      </h3>
      <p className="text-xs text-secondary font-bold max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
