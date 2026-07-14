import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar as CalendarIcon, BookOpen, ClipboardList, RefreshCw, CheckSquare, Target } from 'lucide-react';
import * as plannerApi from '../../api/plannerApi';
import { handleApiError } from '../../utils/handleApiError';
import { formatDate, daysFromNow } from '../../utils/formatDate';
import { ROUTES, buildRoute } from '../../constants/routes';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBanner from '../../components/ui/ErrorBanner';
import PageHeader from '../../components/layout/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import TodaysMission from '../../components/planner/TodaysMission';

const ActivePlan = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recalculating, setRecalculating] = useState(false);
  const [showAutoRecalcBanner, setShowAutoRecalcBanner] = useState(false);

  // Selected date on the calendar, formatted as YYYY-MM-DD (default: today)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Current calendar month view state
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Subjective confidence modal states
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);
  const [confidenceTask, setConfidenceTask] = useState(null);
  const [confidenceBefore, setConfidenceBefore] = useState(3);
  const [confidenceAfter, setConfidenceAfter] = useState(4);

  const fetchPlan = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError(null);
      const planData = await plannerApi.getPlan();
      setPlan(planData);
      
      if (isInitial && planData && planData.examDate) {
        // Center calendar on exam date month if it's in the future
        setCurrentMonthDate(new Date(planData.examDate));
      }

      if (planData?.meta?.wasAutoRecalculated) {
        setShowAutoRecalcBanner(true);
        const timer = setTimeout(() => {
          setShowAutoRecalcBanner(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      const formatted = handleApiError(err);
      if (formatted.status === 404) {
        setPlan(null);
      } else {
        setError(formatted);
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan(true);
  }, [fetchPlan]);

  const handleToggleTask = async (task) => {
    if (!task.completed) {
      setConfidenceTask(task);
      setConfidenceBefore(task.confidenceBefore || 3);
      setConfidenceAfter(task.confidenceAfter || 4);
      setShowConfidenceModal(true);
    } else {
      await performToggleTask(task, false, null, null);
    }
  };

  const performToggleTask = async (task, newCompleted, beforeVal, afterVal) => {
    // Optimistic Update
    setPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === task.id ? { 
            ...t, 
            completed: newCompleted,
            confidenceBefore: beforeVal,
            confidenceAfter: afterVal,
            confidenceGain: afterVal && beforeVal ? afterVal - beforeVal : null
          } : t
        )
      };
    });

    try {
      await plannerApi.updateTask(task.id, newCompleted, beforeVal, afterVal);
      refreshUser().catch(() => {});
      // Refresh backend state to update progress bar and other metadata
      await fetchPlan(false);
    } catch (err) {
      // Rollback on failure
      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === task.id ? { ...t, completed: task.completed } : t
          )
        };
      });
      toast.error('Could not update task.');
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const result = await plannerApi.recalculatePlan();
      toast.success(result.data?.message || result.message || 'Plan updated.');
      await fetchPlan(false);
    } catch (err) {
      toast.error(handleApiError(err).message);
    } finally {
      setRecalculating(false);
    }
  };

  const formatDateString = (d) => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    if (d.toISOString) return d.toISOString().split('T')[0];
    return '';
  };

  // Calendar math
  const getCalendarDays = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon...
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Previous month padding
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        dateStr: '',
        dayNum: prevMonthTotalDays - i,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = dateObj.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true
      });
    }

    return days;
  };

  const changeMonth = (offset) => {
    const newDate = new Date(
      currentMonthDate.getFullYear(),
      currentMonthDate.getMonth() + offset,
      1
    );
    setCurrentMonthDate(newDate);
  };

  if (loading) {
    return (
      <div className="space-y-6 font-sans antialiased text-on-surface text-left animate-pulse">
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 h-72 bg-gray-200 rounded-xl" />
          <div className="md:col-span-8 h-72 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-sans text-left pt-4">
        <ErrorBanner message={error.message} onRetry={() => fetchPlan(true)} />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6 font-sans antialiased text-on-surface text-left">
        <PageHeader
          icon={CalendarIcon}
          title="Study Planner"
          subtitle="Your day-by-day revision schedule"
        />
        <EmptyState
          icon={CalendarIcon}
          heading="No study plan yet"
          description="Create a dynamic daily revision plan based on your notes and target exam dates."
          actionLabel="Create study plan"
          onAction={() => navigate(ROUTES.PLANNER_CREATE)}
        />
      </div>
    );
  }

  const tasksList = plan.tasks || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysTasks = tasksList.filter((t) => t.dateAssigned && formatDateString(t.dateAssigned) === selectedDate);
  const examDateStr = plan.examDate ? formatDateString(plan.examDate) : '';
  const daysLeft = plan.examDate ? Math.max(0, daysFromNow(plan.examDate)) : 0;

  const meta = plan.meta || {
    totalTasks: tasksList.length,
    completedTasks: tasksList.filter(t => t.completed).length,
    overdueTasks: tasksList.filter(t => !t.completed && t.dateAssigned && new Date(t.dateAssigned) < new Date() && formatDateString(t.dateAssigned) !== todayStr).length,
    progressPct: tasksList.length > 0 ? Math.round((tasksList.filter(t => t.completed).length / tasksList.length) * 100) : 0,
    daysUntilExam: daysLeft,
    healthStatus: 'on_track',
    recalcNeeded: false,
    wasAutoRecalculated: false
  };

  const getDayStatus = (dateStr) => {
    const dayTasks = tasksList.filter(
      t => formatDateString(t.dateAssigned) === dateStr
    );
    if (dayTasks.length === 0) return 'none';
    
    const allDone = dayTasks.every(t => t.completed);
    if (allDone) return 'complete';

    const anyDone = dayTasks.some(t => t.completed);

    const taskDate = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);

    if (taskDate < today) {
      return 'overdue';
    }
    return anyDone ? 'partial' : 'pending';
  };

  const calendarDays = getCalendarDays();

  // Helper to format date header
  const getSelectedDateLabel = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMins = (mins) => {
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hrs}h ${remaining}m` : `${hrs}h`;
  };

  // Next 2 days tasks previews
  const tomorrowStr = new Date(new Date().getTime() + 86400000).toISOString().split('T')[0];
  const dayAfterStr = new Date(new Date().getTime() + 172800000).toISOString().split('T')[0];

  const tomorrowTasks = tasksList.filter(t => t.dateAssigned && formatDateString(t.dateAssigned) === tomorrowStr);
  const dayAfterTasks = tasksList.filter(t => t.dateAssigned && formatDateString(t.dateAssigned) === dayAfterStr);

  const tomorrowMins = tomorrowTasks.reduce((sum, t) => sum + (t.estimatedMins || 30), 0);
  const dayAfterMins = dayAfterTasks.reduce((sum, t) => sum + (t.estimatedMins || 30), 0);

  const readinessScore = plan.readinessScore || 0;

  return (
    <div className="space-y-4 text-left select-none relative -mt-4 font-sans">
      {/* Page Header */}
      <PageHeader
        icon={CalendarIcon}
        title="Study Planner"
        subtitle="Your day-by-day revision schedule"
      />
      
      {/* PLAN HEADER */}
      <div className="premium-card p-4 shadow-sm animate-fade-up flex flex-col gap-4">
        <div className="flex justify-between items-start flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-[16px] font-bold text-on-primary-fixed">{plan.examName}</h2>
              <span className="text-on-primary-fixed-variant text-[13px] font-bold">{meta.daysUntilExam} days left</span>
            </div>
            {plan.examDate && (
              <p className="text-tiny text-on-primary-fixed-variant/70 mt-0.5">
                Target date: {formatDate(plan.examDate)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0 self-end sm:self-auto">
            {/* Readiness score badge */}
            <div className="flex flex-col items-center justify-center p-2.5 bg-white/70 border border-primary-fixed-dim/30 rounded-xl min-w-[100px] text-center select-none shadow-sm">
              <span className="text-[9px] font-bold text-primary-fixed-dim uppercase tracking-wider">Readiness</span>
              <div className={`mt-1.5 w-10 h-10 rounded-full border-4 flex items-center justify-center font-bold text-xs ${
                readinessScore >= 70 ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                : readinessScore >= 40 ? 'border-amber-500 text-amber-600 bg-amber-50'
                : 'border-red-500 text-red-600 bg-red-50'
              }`}>
                {readinessScore}%
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="px-3 h-btn_height_default text-on-primary-fixed-variant border border-primary-fixed-dim bg-white/50 hover:bg-white rounded-lg font-bold text-[13px] hover:shadow-sm transition-all duration-200 disabled:opacity-70"
              >
                {recalculating ? 'Recalculating...' : 'Recalculate'}
              </button>
              <Link to={ROUTES.PLANNER_CREATE}>
                <button className="h-btn_height_default px-4 premium-btn-primary rounded-lg font-bold text-[13px] active:scale-95 duration-200">
                  Edit Parameters
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Progress Bar in Header */}
        <div className="w-full">
          <div style={{
            height: 6, background: '#E8F0F6', borderRadius: 3,
            overflow: 'hidden', marginTop: 8,
          }}>
            <div style={{
              height: '100%',
              width: `${meta.progressPct}%`,
              background: meta.progressPct >= 80 ? '#16A34A'
                        : meta.progressPct >= 40 ? '#0F52BA'
                        : '#BA1A1A',
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div className="mt-2">
            <span style={{ fontSize: 12, color: '#5B6775', fontWeight: 600 }}>
              {meta.completedTasks} of {meta.totalTasks} tasks complete · {meta.daysUntilExam} days to exam
            </span>
          </div>
        </div>
      </div>

      {/* HEALTH BANNER (AUTO-SHOWS) */}
      {plan.recoveryMode && (
        <div style={{
          background: 'linear-gradient(135deg, #F3E8FF 0%, #FAF5FF 100%)',
          border: '1px solid #C084FC',
          borderLeft: '4px solid #A855F7',
          borderRadius: '0 8px 8px 0',
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: 13, color: '#7E22CE', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined text-[18px] align-middle">build_circle</span>
              Recovery Mode Active
            </span>
            <button 
              onClick={handleRecalculate}
              disabled={recalculating}
              style={{
                background: '#A855F7', color: 'white',
                border: 'none', borderRadius: 6,
                padding: '6px 14px', fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
                opacity: recalculating ? 0.7 : 1,
              }}>
              {recalculating ? 'Recalculating...' : 'Recalculate Schedule'}
            </button>
          </div>
          <span style={{ fontSize: 12, color: '#6B21A8', fontWeight: 600 }}>
            To keep you on track, we have compressed your remaining schedule, prioritizing weak areas and high-impact topics. Review sessions and lower-priority tasks have been optimized out.
          </span>
        </div>
      )}

      {!plan.recoveryMode && meta.healthStatus === 'falling_behind' && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderLeft: '4px solid #F59E0B',
          borderRadius: '0 8px 8px 0',
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ flex: 1, fontSize: 13, color: '#92400E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined text-[18px] text-amber-600 align-middle">warning</span>
            Falling behind. You have {meta.overdueTasks} overdue tasks. Recalculate to get back on track.
          </span>
          <button 
            onClick={handleRecalculate}
            disabled={recalculating}
            style={{
              background: '#F59E0B', color: 'white',
              border: 'none', borderRadius: 6,
              padding: '6px 14px', fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
              opacity: recalculating ? 0.7 : 1,
            }}>
            {recalculating ? 'Recalculating...' : 'Recalculate'}
          </button>
        </div>
      )}

      {!plan.recoveryMode && meta.healthStatus === 'critical' && (
        <div style={{
          background: '#FEE2E2',
          border: '1px solid #EF4444',
          borderLeft: '4px solid #EF4444',
          borderRadius: '0 8px 8px 0',
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ flex: 1, fontSize: 13, color: '#991B1B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined text-[18px] text-red-600 align-middle">error</span>
            Plan needs recalculation. You have {meta.overdueTasks} overdue tasks.
          </span>
          <button 
            onClick={handleRecalculate}
            disabled={recalculating}
            style={{
              background: '#EF4444', color: 'white',
              border: 'none', borderRadius: 6,
              padding: '6px 14px', fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
              opacity: recalculating ? 0.7 : 1,
            }}>
            {recalculating ? 'Recalculating...' : 'Recalculate Now'}
          </button>
        </div>
      )}

      {/* Auto-recalculated toast-like banner */}
      {showAutoRecalcBanner && (
        <div className="bg-emerald-50 border border-emerald-500 border-l-[4px] rounded-r-lg p-3.5 flex items-center justify-between transition-all animate-fade-in mb-4">
          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
            We automatically adjusted your schedule to keep you on track.
          </span>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* LEFT COLUMN - Calendar */}
        <div className="md:col-span-4 w-full">
          <div className="premium-card p-4 shadow-sm animate-fade-up">
            <div className="flex items-center justify-between mb-4 px-1">
              <button
                onClick={() => changeMonth(-1)}
                className="material-symbols-outlined text-on-primary-fixed-variant hover:bg-primary-fixed/50 p-1 rounded-full flex items-center justify-center transition-all active:scale-90"
              >
                chevron_left
              </button>
              <span className="text-[13px] font-bold text-on-primary-fixed">
                {currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="material-symbols-outlined text-on-primary-fixed-variant hover:bg-primary-fixed/50 p-1 rounded-full flex items-center justify-center transition-all active:scale-90"
              >
                chevron_right
              </button>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center select-none">
              {/* Headers */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((h) => (
                <div
                  key={h}
                  className="text-[11px] font-bold text-on-primary-fixed-variant/70 uppercase tracking-wider"
                >
                  {h}
                </div>
              ))}
              {/* Days cells */}
              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={`prev-${idx}`}
                      className="flex flex-col items-center justify-center h-9 text-on-primary-fixed-variant/30 text-[12px]"
                    >
                      {cell.dayNum}
                    </div>
                  );
                }

                const isSelected = selectedDate === cell.dateStr;
                const isToday = cell.dateStr === todayStr;
                const isExam = cell.dateStr === examDateStr;

                return (
                  <div
                    key={`active-${idx}`}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className="flex flex-col items-center justify-center h-9 cursor-pointer group"
                  >
                    {isExam ? (
                      <div
                        className={`w-8 h-8 rounded-lg bg-danger/10 border border-danger text-danger text-[12px] font-bold flex items-center justify-center relative ${
                          isSelected ? 'ring-2 ring-danger/20' : ''
                        }`}
                        title="Exam Target"
                      >
                        {cell.dayNum}
                        <span className="absolute -bottom-2.5 text-[8px] font-extrabold text-danger uppercase tracking-tighter">Exam</span>
                      </div>
                    ) : isToday ? (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold transition-all bg-primary ${
                          isSelected ? 'ring-4 ring-primary/20' : ''
                        }`}
                      >
                        {cell.dayNum}
                      </div>
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full flex flex-col items-center justify-center text-[12px] transition-all relative ${
                          isSelected
                            ? 'border border-primary bg-primary/10 text-primary font-bold shadow-sm'
                            : 'text-on-primary-fixed hover:bg-primary-fixed/50 hover:text-primary'
                        }`}
                      >
                        <span>{cell.dayNum}</span>
                        {(() => {
                          const status = getDayStatus(cell.dateStr);
                          if (status === 'none') return null;
                          const dotColor = status === 'complete' ? '#16A34A'
                                         : status === 'partial' ? '#D97706'
                                         : status === 'pending' ? '#0F52BA'
                                         : '#BA1A1A';
                          return (
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: dotColor,
                                position: 'absolute',
                                bottom: 2,
                              }}
                            />
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 text-center border-t border-primary-fixed-dim/50 pt-4">
              <p className="text-[11px] text-on-primary-fixed-variant/70 font-medium">Click any date to view tasks</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Task List */}
        <div className="md:col-span-8 w-full flex flex-col gap-4">
          
          {/* Mission Widget (at the top if today is selected) */}
          {selectedDate === todayStr && (
            <TodaysMission 
              compact={false} 
              planTasks={tasksList} 
              examNameProp={plan.examName} 
              examDateProp={plan.examDate} 
            />
          )}

          {/* Date task checklist */}
          <div className="premium-card p-[16px_20px] shadow-sm text-left animate-fade-up animation-delay-100">
            <h3 className="text-[13px] font-bold text-on-primary-fixed-variant/80 mb-3 border-b border-primary-fixed-dim/30 pb-2">
              {getSelectedDateLabel()}
            </h3>
            {todaysTasks.length === 0 ? (
              <p className="text-body text-on-primary-fixed-variant/85 py-4 italic">
                No revision tasks scheduled for this date.
              </p>
            ) : (
              <div className="space-y-2">
                {todaysTasks.map((task) => (
                  <div
                    key={task.id || task._id}
                    id={`task-card-${task.id || task._id}`}
                    className={`p-3 border rounded-xl flex items-center justify-between gap-3 bg-white/80 transition-all ${
                      task.completed ? 'opacity-60 border-primary-fixed-dim/20 bg-gray-50/50' : 'border-primary-fixed-dim/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate flex-grow">
                      {/* Checkbox */}
                      <div
                        onClick={() => handleToggleTask(task)}
                        className={`w-[16px] h-[16px] border border-primary-fixed-dim rounded-[4px] cursor-pointer flex items-center justify-center hover:border-primary transition-colors shrink-0 ${
                          task.completed ? 'bg-success border-success text-white' : 'bg-white'
                        }`}
                      >
                        {task.completed && (
                          <span
                            className="material-symbols-outlined text-white text-[10px] font-bold"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check
                          </span>
                        )}
                      </div>

                      {/* Type Icon */}
                      {(() => {
                        const Icon = task.type === 'read' ? BookOpen
                                   : task.type === 'quiz' ? ClipboardList
                                   : task.type === 'review' ? RefreshCw
                                   : CheckSquare;
                        const colorClass = task.type === 'read' ? 'text-[#0F52BA]'
                                         : task.type === 'quiz' ? 'text-[#7C3AED]'
                                         : task.type === 'review' ? 'text-[#D97706]'
                                         : 'text-[#5B6775]';
                        return <Icon className={`w-4 h-4 shrink-0 ${colorClass}`} />;
                      })()}

                      {/* Title & metadata */}
                      <div className="flex flex-col truncate">
                        <span className={`text-[13px] font-bold text-[#000926] truncate ${task.completed ? 'line-through opacity-60' : ''}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {task.sourceNoteTitle && (
                            <span className="px-1.5 py-0.5 bg-primary/10 border border-primary-fixed-dim/20 text-primary text-[9px] rounded font-bold truncate max-w-[120px]" title={task.sourceNoteTitle}>
                              {task.sourceNoteTitle}
                            </span>
                          )}
                          {task.metadata?.suggestedPages && (
                            <span className="text-[9px] font-bold text-primary-fixed-dim flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px] align-middle">book</span>
                              {task.metadata.suggestedPages}
                            </span>
                          )}
                          <span className="text-[9px] font-bold text-primary-fixed-dim flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px] align-middle">schedule</span>
                            {task.estimatedMins || 30} min
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right badges & actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end gap-1 select-none">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          task.type === 'read' ? 'bg-[#0F52BA]/10 text-[#0F52BA]'
                          : task.type === 'quiz' ? 'bg-[#7C3AED]/10 text-[#7C3AED]'
                          : task.type === 'review' ? 'bg-[#D97706]/10 text-[#D97706]'
                          : 'bg-[#5B6775]/10 text-[#5B6775]'
                        }`}>
                          {task.type}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            task.priority === 'high' ? 'bg-red-500'
                            : task.priority === 'medium' ? 'bg-amber-500'
                            : 'bg-green-500'
                          }`} />
                          <span className="text-[9px] font-bold text-primary-fixed-dim uppercase tracking-wider">{task.priority}</span>
                        </div>
                      </div>

                      {/* Action button */}
                      {!task.completed && (() => {
                        if (task.type === 'quiz') {
                          return (
                            <button
                              onClick={() => navigate(ROUTES.QUIZ_GENERATE, { state: { noteId: task.sourceNoteId, topic: task.topic } })}
                              className="px-2.5 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-dark transition-all active:scale-95 shadow-sm"
                            >
                              Start Quiz
                            </button>
                          );
                        }
                        if (task.type === 'read' && task.sourceNoteId) {
                          return (
                            <button
                              onClick={() => navigate(buildRoute(ROUTES.NOTE_DETAIL, { id: task.sourceNoteId }))}
                              className="px-2.5 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-dark transition-all active:scale-95 shadow-sm"
                            >
                              Open Note
                            </button>
                          );
                        }
                        if (task.type === 'review') {
                          return (
                            <button
                              onClick={() => navigate(ROUTES.GAPS)}
                              className="px-2.5 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-dark transition-all active:scale-95 shadow-sm"
                            >
                              Review Gaps
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Schedule Previews */}
          {selectedDate === todayStr && (
            <div className="border-t border-primary-fixed-dim/20 pt-4 text-left">
              <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">Upcoming Schedule</h4>
              <div className="space-y-2">
                <div 
                  onClick={() => setSelectedDate(tomorrowStr)}
                  className="p-3 bg-white/60 hover:bg-[#D6E6F3]/20 border border-primary-fixed-dim/25 rounded-lg flex justify-between items-center text-xs font-semibold cursor-pointer transition-all hover:translate-x-0.5 hover:shadow-sm"
                >
                  <span className="text-on-primary-fixed">Tomorrow</span>
                  <span className="text-primary-fixed-dim font-bold">{tomorrowTasks.length} tasks ({formatMins(tomorrowMins)})</span>
                </div>
                <div 
                  onClick={() => setSelectedDate(dayAfterStr)}
                  className="p-3 bg-white/60 hover:bg-[#D6E6F3]/20 border border-primary-fixed-dim/25 rounded-lg flex justify-between items-center text-xs font-semibold cursor-pointer transition-all hover:translate-x-0.5 hover:shadow-sm"
                >
                  <span className="text-on-primary-fixed">Day after tomorrow</span>
                  <span className="text-primary-fixed-dim font-bold">{dayAfterTasks.length} tasks ({formatMins(dayAfterMins)})</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subjective Confidence Modal */}
      {showConfidenceModal && confidenceTask && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-[400px] w-full mx-4 text-left border border-primary-fixed-dim/20">
            <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider mb-2">Subjective Confidence</h3>
            <p className="text-xs text-primary-fixed-dim font-bold mb-4">
              Rate how confident you felt about "{confidenceTask.title}" before vs. after completing it.
            </p>
            
            {/* Confidence Before Rating */}
            <div className="mb-4">
              <label className="text-xs font-bold text-on-surface block mb-1.5">Confidence BEFORE (1-5):</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setConfidenceBefore(val)}
                    className={`w-[44px] h-[34px] rounded-lg border font-bold text-xs transition-all duration-200 ${
                      confidenceBefore === val
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'border-primary-fixed-dim/40 bg-primary-fixed/10 text-on-primary-fixed-variant hover:bg-primary-fixed/20'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence After Rating */}
            <div className="mb-6">
              <label className="text-xs font-bold text-on-surface block mb-1.5">Confidence AFTER (1-5):</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setConfidenceAfter(val)}
                    className={`w-[44px] h-[34px] rounded-lg border font-bold text-xs transition-all duration-200 ${
                      confidenceAfter === val
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'border-primary-fixed-dim/40 bg-primary-fixed/10 text-on-primary-fixed-variant hover:bg-primary-fixed/20'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-primary-fixed-dim/20 pt-3">
              <button
                onClick={() => {
                  setShowConfidenceModal(false);
                  setConfidenceTask(null);
                }}
                className="px-4 h-btn_height_default text-[11px] font-bold border border-primary-fixed-dim text-on-primary-fixed-variant bg-white/50 hover:bg-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  performToggleTask(confidenceTask, true, confidenceBefore, confidenceAfter);
                  setShowConfidenceModal(false);
                  setConfidenceTask(null);
                }}
                className="px-5 h-btn_height_default text-[11px] font-bold premium-btn-primary rounded-lg shadow-md transition-all"
              >
                Save & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivePlan;
