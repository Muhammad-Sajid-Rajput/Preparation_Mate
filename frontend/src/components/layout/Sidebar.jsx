import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ collapsed, notesCount }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Derive initials and display name from user
  const displayName = user?.name
    ? user.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';
  const fullName = user?.name
    ? user.name.split(' ')[0] + (user.name.split(' ')[1] ? ` ${user.name.split(' ')[1][0]}.` : '')
    : 'User';
  const role = user?.role === 'admin' ? 'Admin' : 'Student';
  const preloadMap = {
    '/app/dashboard': () => import('../../pages/dashboard/Dashboard'),
    '/app/notes': () => import('../../pages/notes/NotesList'),
    '/app/quizzes': () => import('../../pages/quizzes/QuizHistory'),
    '/app/gaps': () => import('../../pages/gaps/KnowledgeGaps'),
    '/app/chat': () => import('../../pages/chat/AIAssistant'),
    '/app/planner': () => import('../../pages/planner/ActivePlan'),
    '/app/interview': () => import('../../pages/interview/InterviewSetup'),
    '/app/resume': () => import('../../pages/resume/ResumeUpload'),
    '/app/profile': () => import('../../pages/account/Profile'),
    '/app/settings': () => import('../../pages/account/AccountSettings'),
  };

  const sections = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', path: '/app/dashboard', icon: 'dashboard' },
        { name: 'My Notes', path: '/app/notes', icon: 'description', badge: notesCount },
        { name: 'Quizzes', path: '/app/quizzes', icon: 'quiz' },
        { name: 'Knowledge Gaps', path: '/app/gaps', icon: 'psychology' },
        { name: 'AI Assistant', path: '/app/chat', icon: 'smart_toy' },
      ]
    },
    {
      title: 'Career',
      items: [
        { name: 'Study Planner', path: '/app/planner', icon: 'calendar_today' },
        { name: 'Interview Prep', path: '/app/interview', icon: 'record_voice_over' },
        { name: 'Resume Review', path: '/app/resume', icon: 'article' },
      ]
    },
    {
      title: 'Account',
      items: [
        { name: 'Profile', path: '/app/profile', icon: 'account_circle' },
        { name: 'Settings', path: '/app/settings', icon: 'settings' },
      ]
    }
  ];

  if (collapsed) {
    return (
      <aside className="w-[60px] h-screen fixed left-0 top-0 glass-sidebar flex flex-col items-center py-6 gap-6 z-50 select-none">
        <div className="text-white flex items-center justify-center hover:scale-110 transition-transform duration-200">
          <span className="material-symbols-outlined text-2xl font-bold font-fill-1">bolt</span>
        </div>
        <div className="flex flex-col gap-4 flex-grow w-full px-2">
          {sections[0].items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onMouseEnter={() => preloadMap[item.path]?.()}
              onFocus={() => preloadMap[item.path]?.()}
              className={({ isActive }) =>
                `w-10 h-10 flex items-center justify-center rounded-lg transition-all active:scale-95 hover:scale-105 duration-200 ${isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
              title={item.name}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </NavLink>
          ))}
        </div>
        <div className="flex flex-col gap-4 pb-4 w-full px-2">
          <NavLink
            to="/app/profile"
            onMouseEnter={() => preloadMap['/app/profile']?.()}
            onFocus={() => preloadMap['/app/profile']?.()}
            className={({ isActive }) =>
              `w-10 h-10 flex items-center justify-center rounded-lg transition-all active:scale-95 hover:scale-105 duration-200 ${isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
            title="Profile"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </NavLink>
          <NavLink
            to="/app/settings"
            onMouseEnter={() => preloadMap['/app/settings']?.()}
            onFocus={() => preloadMap['/app/settings']?.()}
            className={({ isActive }) =>
              `w-10 h-10 flex items-center justify-center rounded-lg transition-all active:scale-95 hover:scale-105 duration-200 ${isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
            title="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </NavLink>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-sidebar_width h-screen fixed left-0 top-0 glass-sidebar flex flex-col z-50 select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-white font-fill-1 hover:rotate-12 transition-transform duration-200">bolt</span>
        <span className="font-h1 text-[14px] font-bold text-white tracking-tight">Preparation Mate</span>
      </div>


      {/* Navigation List */}
      <nav className="flex-grow px-3 overflow-y-auto scrollbar-hide space-y-6 mt-4">
        {sections.map((section, idx) => (
          <div key={idx}>
            <p className="px-3 text-overline text-primary-fixed-dim/80 uppercase mb-2 text-left">{section.title}</p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onMouseEnter={() => preloadMap[item.path]?.()}
                  onFocus={() => preloadMap[item.path]?.()}
                  className={({ isActive }) =>
                    `flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all active:scale-95 hover:translate-x-0.5 duration-200 ${isActive
                      ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                      : 'text-white/80 hover:bg-white/10 hover:text-white font-semibold'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="text-xs">{item.name}</span>
                  </div>
                  {item.badge != null && item.badge > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                      location.pathname === item.path
                        ? 'bg-white/20 text-white'
                        : 'bg-white/15 text-primary-fixed'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/15">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10 border border-white/15">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-semibold text-xs shadow-sm">
            {displayName}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-bold text-white leading-tight">{fullName}</span>
            <span className="text-[11px] text-white/75 font-semibold mt-0.5">{role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
