import React from 'react';

const StatCard = ({ title, value, trend = 'none', trendLabel, icon, accentColor, className }) => {
  const isUp = trend === 'up';
  const isDown = trend === 'down';

  return (
    <div
      className={`premium-card flex flex-col justify-between overflow-hidden relative !pt-[14px] !pb-3 !px-4 ${className || ''}`}
    >
      {/* Top accent bar */}
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
          style={{ background: accentColor }}
        />
      )}

      <div className="flex items-center justify-between mb-1 select-none">
        <span className="text-[10px] uppercase tracking-wider text-on-primary-fixed-variant/80 font-bold">
          {title}
        </span>
        {icon && (
          <span className="material-symbols-outlined !text-[18px]" style={{ color: accentColor || '#0F52BA' }}>
            {typeof icon === 'string' ? icon : null}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-0.5">
        <span className="font-data-mono text-[22px] font-extrabold tabular-nums tracking-tight text-on-primary-fixed leading-none">
          {value}
        </span>
        {trend !== 'none' && (
          <div className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${isUp
              ? 'text-success bg-success-light/40 border border-success/10'
              : 'text-warning bg-warning-light/40 border border-warning/10'
            }`}>
            <span className="material-symbols-outlined !text-[14px] mr-0.5">
              {isUp ? 'arrow_upward' : 'arrow_downward'}
            </span>
            <span className="font-data-mono">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
