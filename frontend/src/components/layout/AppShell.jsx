import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomTabBar from './BottomTabBar';
import RouteLoader from '../ui/RouteLoader';
import * as notesApi from '../../api/notesApi';

const AppShell = () => {
  const location = useLocation();
  const isQuizTaking = /^\/app\/quizzes\/\d+$/.test(location.pathname);
  const isQuizHistory = location.pathname === '/app/quizzes';
  const isKnowledgeGaps = location.pathname === '/app/gaps';
  const isChat = location.pathname === '/app/chat';
  const isQuizHistoryOrTakingOrGaps = isQuizTaking || isQuizHistory || isKnowledgeGaps || isChat;
  
  const [notes, setNotes] = useState(null);
  const [notesLoading, setNotesLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    try {
      const data = await notesApi.getNotes();
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const notesCount = notes !== null ? notes.length : null;

  return (
    <div className="h-screen overflow-hidden bg-background text-on-surface flex flex-col font-sans">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block">
        <Sidebar collapsed={isQuizTaking} notesCount={notesCount} />
      </div>

      {/* Main Content wrapper */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-150 ${
        isQuizTaking ? 'md:ml-[60px]' : 'md:ml-sidebar_width'
      }`}>
        {/* Top Header */}
        {!isQuizTaking && <Topbar />}

        {/* Page Canvas */}
        <main className={`flex-1 overflow-x-hidden pb-topbar_height md:pb-0 px-4 md:px-6 relative ${
          isQuizHistoryOrTakingOrGaps ? 'overflow-y-hidden flex flex-col' : 'overflow-y-auto'
        }`}>
          <div key={location.pathname} className={`mx-auto w-full animate-fade-up max-w-6xl ${
            isQuizHistoryOrTakingOrGaps
              ? `flex-1 flex flex-col min-h-0 ${isQuizTaking ? 'py-2' : 'py-4'}`
              : 'py-6'
          }`}>
            <Suspense fallback={<RouteLoader fullscreen={false} />}>
              <Outlet context={{ notes, setNotes, fetchNotes, notesLoading }} />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Bottom Nav Bar - Mobile Only */}
      {!isQuizTaking && <BottomTabBar />}
    </div>
  );
};

export default AppShell;
