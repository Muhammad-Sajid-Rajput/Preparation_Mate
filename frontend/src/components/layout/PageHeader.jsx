import React from 'react';
const PageHeader = ({ icon: Icon, title, subtitle, action }) => {
  return (
    <div className="pm-page-header">
      {/* Left: Icon + Text */}
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[#D6E6F3] flex items-center justify-center shrink-0">
            <Icon size={16} className="text-primary" />
          </div>
        )}
        <div className="flex flex-col text-left">
          <h1 className="text-[18px] font-bold text-[#000926] leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] text-[#5B6775] font-medium mt-0.5 leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Action slot */}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default PageHeader;
