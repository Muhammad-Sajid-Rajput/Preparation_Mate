import React from 'react';

const ProgressBar = ({ value = 0, max = 100, showLabel = false, className = '' }) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs font-bold text-secondary">
          <span>Progress</span>
          <span className="text-on-surface">{Math.round(percent)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-[#D6E6F3] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, background: 'linear-gradient(90deg, #0F52BA, #3A7BFF)' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
