import React from 'react';

const ScoreRing = ({ score = 0, size = 120, strokeWidth = 10, className = '' }) => {
  const percent = Math.min(100, Math.max(0, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  // Color logic
  let strokeColor = 'text-danger'; // red
  if (percent >= 60 && percent < 80) {
    strokeColor = 'text-warning'; // amber
  } else if (percent >= 80) {
    strokeColor = 'text-success'; // green
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Circle */}
        <circle
          className="text-[#D6E6F3]"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Foreground Circle */}
        <circle
          className={`${strokeColor} transition-all duration-500 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Center Label */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-extrabold text-[#000926] tracking-tight">{percent}%</span>
        <span className="text-[10px] uppercase font-bold text-[#5B6775] tracking-widest mt-0.5">Score</span>
      </div>
    </div>
  );
};

export default ScoreRing;
