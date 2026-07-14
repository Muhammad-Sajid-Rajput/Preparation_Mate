import React, { useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

// Map path patterns → { section, label, icon (material symbol) }
const getRouteInfo = (path) => {
  // Main
  if (path.includes('/app/dashboard'))      return { section: 'Main',    label: 'Dashboard',          icon: 'dashboard' };
  if (path.includes('/app/notes'))          return { section: 'Main',    label: 'My Notes',            icon: 'description' };
  if (path.includes('/app/quizzes/generate')) return { section: 'Main', label: 'Generate Quiz',       icon: 'auto_awesome' };
  if (path.includes('/results'))            return { section: 'Main',    label: 'Quiz Results',        icon: 'emoji_events' };
  if (path.includes('/app/quizzes'))        return { section: 'Main',    label: 'Quizzes',             icon: 'quiz' };
  if (path.includes('/app/gaps'))           return { section: 'Main',    label: 'Knowledge Gaps',      icon: 'psychology' };
  if (path.includes('/app/chat'))           return { section: 'Main',    label: 'AI Assistant',        icon: 'smart_toy' };
  // Career
  if (path.includes('/app/planner/create')) return { section: 'Career',  label: 'Create Study Plan',  icon: 'edit_calendar' };
  if (path.includes('/app/planner'))        return { section: 'Career',  label: 'Study Planner',       icon: 'calendar_today' };
  if (path.includes('/app/interview/history')) return { section: 'Career', label: 'Interview History', icon: 'history' };
  if (path.includes('/app/interview'))      return { section: 'Career',  label: 'Interview Prep',      icon: 'record_voice_over' };
  if (path.includes('/app/resume'))         return { section: 'Career',  label: 'Resume Review',       icon: 'article' };
  // Account
  if (path.includes('/app/profile'))        return { section: 'Account', label: 'Profile',             icon: 'person' };
  if (path.includes('/app/settings'))       return { section: 'Account', label: 'Settings',            icon: 'tune' };
  // Admin
  if (path.includes('/admin'))              return { section: 'Admin',   label: 'Admin Dashboard',     icon: 'admin_panel_settings' };
  return { section: '', label: 'Preparation Mate', icon: 'school' };
};

const Topbar = ({ onToggleMobileMenu }) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const { section, label, icon } = getRouteInfo(location.pathname);

  // Initials from user name
  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const isAdmin = location.pathname.includes('/admin/');

  return (
    <header className="h-topbar_height glass-nav flex items-center justify-between px-6 z-45 shrink-0">
      {/* LEFT: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1 text-on-primary-fixed-variant hover:text-primary transition-all active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}

        {/* Breadcrumb row */}
        <div className="flex items-center gap-2 select-none">
          <span className="material-symbols-outlined !text-[18px] text-primary shrink-0">{icon}</span>

          {section && (
            <>
              <span className="text-[12px] font-semibold text-[#5B6775] hidden sm:inline">{section}</span>
              <span className="text-[12px] text-[#A6C5D7] hidden sm:inline">/</span>
            </>
          )}

          <h1 className="text-[14px] font-semibold text-[#000926] tracking-tight leading-none">
            {label}
          </h1>

          {isAdmin && (
            <div className="flex items-center gap-2 ml-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-widest bg-red-500 text-white px-2 py-0.5 rounded-full">
                Admin mode
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-green-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                System healthy
              </span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <Link
          to="/app/notifications"
          className="relative text-[#5B6775] hover:text-primary transition-all hover:scale-105 active:scale-95 duration-200 flex items-center justify-center"
        >
          <span className="material-symbols-outlined !text-[20px]">notifications</span>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full border border-white" />
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-[#D6E6F3]" />

        {/* Initials Avatar */}
        <Link to="/app/profile">
          <div className="w-[30px] h-[30px] rounded-full bg-primary flex items-center justify-center cursor-pointer hover:scale-105 transition-all duration-200 shadow-sm">
            <span className="text-white text-[11px] font-bold leading-none">{initials}</span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Topbar;
