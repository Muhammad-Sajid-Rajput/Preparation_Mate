import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const BottomTabBar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  const mainTabs = [
    { name: 'Home', path: '/app/dashboard', icon: 'home' },
    { name: 'Notes', path: '/app/notes', icon: 'description' },
    { name: 'Quiz', path: '/app/quizzes', icon: 'quiz' },
    { name: 'AI', path: '/app/chat', icon: 'smart_toy' },
  ];

  const drawerLinks = [
    { name: 'Study Planner', path: '/app/planner', icon: 'calendar_today' },
    { name: 'Interview Prep', path: '/app/interview', icon: 'record_voice_over' },
    { name: 'Resume Review', path: '/app/resume', icon: 'contact_page' },
    { name: 'Profile', path: '/app/profile', icon: 'person' },
    { name: 'Settings', path: '/app/settings', icon: 'settings' },
  ];

  return (
    <>
      {/* Bottom Tab Bar (Mobile Only) */}
      <nav className="md:hidden h-[56px] min-h-[56px] w-full bg-surface-container-lowest border-t border-outline-variant flex items-center justify-around px-2 z-40 fixed bottom-0 left-0 right-0">
        {mainTabs.map((tab) => {
          const isActive = location.pathname === tab.path;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center h-full flex-1 transition-all ${
                isActive ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'font-fill-1' : ''}`}>{tab.icon}</span>
              <span className="text-label font-label">{tab.name}</span>
            </NavLink>
          );
        })}

        <button
          onClick={toggleDrawer}
          className={`flex flex-col items-center justify-center h-full flex-1 transition-all ${
            drawerOpen ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined">more_horiz</span>
          <span className="text-label font-label">More</span>
        </button>
      </nav>

      {/* Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
      >
        {/* Drawer Content */}
        <div
          className={`absolute bottom-0 w-full bg-white rounded-t-3xl transition-transform duration-300 ease-out flex flex-col max-h-[85%] ${
            drawerOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle Bar */}
          <div className="w-full flex flex-col items-center py-4 border-b border-outline-variant">
            <div className="w-12 h-1.5 bg-outline-variant rounded-full mb-3"></div>
            <h2 className="font-section-header text-section-header font-bold text-on-surface">Menu</h2>
          </div>

          {/* Drawer Navigation Items */}
          <div className="flex-grow overflow-y-auto px-4 py-6 space-y-2">
            {drawerLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path);
                    closeDrawer();
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                    isActive ? 'bg-surface-container text-primary' : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-primary">{link.icon}</span>
                    <span className="font-body text-body font-medium">{link.name}</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </button>
              );
            })}

            <hr className="border-outline-variant my-4" />

            {/* Logout button */}
            <button
              onClick={() => {
                navigate('/');
                closeDrawer();
              }}
              className="w-full py-4 text-error font-medium flex items-center justify-center gap-2 hover:bg-error-container/20 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BottomTabBar;
