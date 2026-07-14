import React from 'react';

const MasteryBar = ({ value = 0, className = '' }) => {
  // Ensure value is between 0 and 100
  const percent = Math.min(100, Math.max(0, value));

  // Determine color based on value
  let barColor = 'bg-danger'; // red
  if (percent >= 40 && percent <= 60) {
    barColor = 'bg-warning'; // amber
  } else if (percent > 60) {
    barColor = 'bg-success'; // green
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1 text-xs font-bold text-secondary">
        <span>Mastery Level</span>
        <span className="text-on-surface">{percent}%</span>
      </div>
      <div className="w-full h-1.5 bg-primary-fixed/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default MasteryBar;
