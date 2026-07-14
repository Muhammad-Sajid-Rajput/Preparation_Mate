import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ClipboardList, RefreshCw, CheckSquare, Target } from 'lucide-react';
import * as plannerApi from '../../api/plannerApi';
import { ROUTES, buildRoute } from '../../constants/routes';

const TodaysMission = ({ compact = false, planTasks = null, examNameProp = null, examDateProp = null, potentialIncrease = 0 }) => {
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  useEffect(() => {
    if (planTasks) {
      setLoading(false);
      return;
    }

    let active = true;
    plannerApi.getTodaysMission()
      .then((data) => {
        if (active && data) {
          setMission(data);
        }
      })
      .catch(() => {
        if (active) setMission(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [planTasks]);

  // Derived state from props or fetched mission
  const todayStr = new Date().toISOString().split('T')[0];
  
  let examName = examNameProp;
  let daysLeft = 0;
  let todayTasks = [];

  if (planTasks) {
    todayTasks = planTasks.filter(
      (t) => t.dateAssigned && t.dateAssigned.split('T')[0] === todayStr
    );
    if (examDateProp) {
      daysLeft = Math.max(0, Math.ceil((new Date(examDateProp) - new Date()) / (1000 * 60 * 60 * 24)));
    }
  } else if (mission) {
    todayTasks = mission.tasks || [];
    examName = mission.examName;
    daysLeft = mission.daysLeft;
  }

  const totalMins = todayTasks.reduce((sum, t) => sum + (t.estimatedMins || 30), 0);
  const completedCount = todayTasks.filter((t) => t.completed).length;
  const totalCount = todayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  // Auto-select first incomplete task on tasks load
  useEffect(() => {
    if (todayTasks.length > 0 && !selectedTaskId) {
      const firstIncomplete = todayTasks.find((t) => !t.completed);
      if (firstIncomplete) {
        setSelectedTaskId(firstIncomplete.id || firstIncomplete._id);
      } else {
        setSelectedTaskId(todayTasks[0].id || todayTasks[0]._id);
      }
    }
  }, [todayTasks, selectedTaskId]);

  const formatMins = (mins) => {
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hrs}h ${remaining}m` : `${hrs}h`;
  };

  if (loading) {
    return (
      <div className="p-5 border border-primary-fixed-dim/40 rounded-xl bg-white/70 animate-pulse text-left">
        <div className="h-5 w-28 bg-gray-200 rounded mb-3" />
        <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
        <div className="h-2 w-full bg-gray-200 rounded-full" />
      </div>
    );
  }

  // Handle empty state (no plan)
  if (!planTasks && !mission) {
    return (
      <div className="p-5 border border-primary-fixed-dim/40 rounded-xl bg-white/70 text-left">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Target className="w-5 h-5 animate-pulse" />
          <h4 className="text-[13px] font-bold uppercase tracking-wider">Today's Mission</h4>
        </div>
        <p className="text-xs text-primary-fixed-dim font-semibold mb-3">
          Create a study plan to see your daily schedule and stay on track.
        </p>
        <button
          onClick={() => navigate(ROUTES.PLANNER_CREATE)}
          className="text-primary text-[11px] font-bold hover:underline flex items-center gap-0.5"
        >
          Create a study plan
        </button>
      </div>
    );
  }

  if (allDone && compact) {
    return (
      <div className="p-5 border border-[#A6C5D7] rounded-xl bg-emerald-50 text-left">
        <div className="flex items-center gap-2 text-emerald-600 mb-2">
          <Target className="w-5 h-5" />
          <h4 className="text-[13px] font-bold uppercase tracking-wider">Today's Mission</h4>
        </div>
        <p className="text-xs text-emerald-800 font-bold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] font-bold">check_circle</span>
          All done for today! Great work.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="p-5 border border-[#A6C5D7] rounded-xl bg-[#D6E6F3]/30 text-left">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-primary">
            <Target className="w-5 h-5" />
            <h4 className="text-[13px] font-bold uppercase tracking-wider">Today's Mission</h4>
          </div>
          <button
            onClick={() => navigate(ROUTES.PLANNER)}
            className="text-primary text-[11px] font-bold hover:underline"
          >
            View tasks
          </button>
        </div>
        <p className="text-xs text-on-primary-fixed font-bold mb-2">
          {totalCount} tasks · {formatMins(totalMins)} · {completedCount} complete
        </p>
        <div className="w-full bg-[#E8F0F6] h-2 rounded-full overflow-hidden mb-1">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[10px] text-primary font-bold">{progressPercent}% complete</span>
      </div>
    );
  }

  const selectedTask = todayTasks.find(t => (t.id || t._id) === selectedTaskId);

  // Full Version
  return (
    <div
      className="p-5 rounded-xl border select-none transition-all"
      style={{
        background: 'linear-gradient(135deg, #D6E6F3 0%, white 60%)',
        borderColor: '#A6C5D7',
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 text-primary">
          <Target className="w-5 h-5" />
          <h4 className="text-[13px] font-bold uppercase tracking-wider">Today's Mission</h4>
        </div>
        <div className="flex items-center gap-2">
          {potentialIncrease > 0 && (
            <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] rounded font-bold">
              Potential: +{potentialIncrease}% readiness
            </span>
          )}
          {daysLeft > 0 && (
            <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[10px] rounded font-bold">
              {daysLeft} days left
            </span>
          )}
        </div>
      </div>

      {examName && (
        <h3 className="text-body font-bold text-on-primary-fixed mt-2 text-left">{examName}</h3>
      )}

      {totalCount === 0 ? (
        <p className="text-xs text-primary-fixed-dim font-semibold italic mt-4 text-left">
          No revision tasks scheduled for today.
        </p>
      ) : (
        <>
          <div className="mt-3 flex justify-between items-end text-[11px] font-bold text-on-primary-fixed-variant">
            <span>{formatMins(totalMins)} of study today</span>
            <span>{completedCount} of {totalCount} complete</span>
          </div>

          <div className="w-full bg-[#E8F0F6] h-2 rounded-full overflow-hidden mt-1.5 mb-4">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Today's Goals (Selectable task list) */}
          <div className="space-y-2 mb-4 text-left">
            {todayTasks.map((task) => {
              const Icon = task.type === 'read' ? BookOpen
                         : task.type === 'quiz' ? ClipboardList
                         : task.type === 'review' ? RefreshCw
                         : CheckSquare;
              const colorClass = task.type === 'read' ? 'text-[#0F52BA]'
                               : task.type === 'quiz' ? 'text-[#7C3AED]'
                               : task.type === 'review' ? 'text-[#D97706]'
                               : 'text-[#5B6775]';
              const isSelected = (task.id || task._id) === selectedTaskId;
              return (
                <div
                  key={task.id || task._id}
                  onClick={() => setSelectedTaskId(task.id || task._id)}
                  className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary-fixed/20 shadow-sm ring-1 ring-primary/20'
                      : 'border-primary-fixed-dim/30 bg-white/50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${colorClass}`} />
                    <span className={`text-xs font-bold truncate ${task.completed ? 'line-through text-primary-fixed-dim' : 'text-on-primary-fixed'}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-primary-fixed-dim">{task.estimatedMins || 30} min</span>
                    {task.completed && (
                      <span className="material-symbols-outlined text-success text-[14px] font-extrabold">check</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Task Detailed Panel */}
          {selectedTask && (
            <div className="mt-4 p-4 rounded-xl border border-primary-fixed-dim/20 bg-white/90 shadow-sm text-left animate-fade-in">
              <div className="flex justify-between items-start gap-2 mb-2.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                  {selectedTask.type}
                </span>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedTask.priority === 'high' ? 'bg-red-500' 
                    : selectedTask.priority === 'medium' ? 'bg-amber-500' 
                    : 'bg-green-500'
                  }`} />
                  <span className="text-[9px] font-bold text-primary-fixed-dim uppercase tracking-wider">{selectedTask.priority}</span>
                </div>
              </div>
              
              <h5 className="text-xs font-bold text-on-surface mb-3">{selectedTask.goal || selectedTask.title}</h5>
              
              {selectedTask.whyThisMatters && (
                <div className="mb-3">
                  <span className="text-[9px] font-bold text-primary-fixed-dim uppercase tracking-wider block mb-0.5">Why This Matters</span>
                  <p className="text-xs text-on-surface-variant font-semibold leading-normal">{selectedTask.whyThisMatters}</p>
                </div>
              )}

              {selectedTask.expectedImpact && (
                <div className="mb-4">
                  <span className="text-[9px] font-bold text-primary-fixed-dim uppercase tracking-wider block mb-0.5">Expected Impact</span>
                  <p className="text-xs text-on-surface-variant font-semibold leading-normal">{selectedTask.expectedImpact}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-primary-fixed-dim/10">
                {selectedTask.type === 'read' && selectedTask.sourceNoteId && (
                  <button
                    onClick={() => navigate(buildRoute(ROUTES.NOTE_DETAIL, { id: selectedTask.sourceNoteId }))}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-all active:scale-95 shadow-sm"
                  >
                    Open Note
                  </button>
                )}
                {selectedTask.type === 'quiz' && (
                  <button
                    onClick={() => navigate(ROUTES.QUIZ_GENERATE, { state: { noteId: selectedTask.sourceNoteId, topic: selectedTask.topic } })}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-all active:scale-95 shadow-sm"
                  >
                    Start Quiz
                  </button>
                )}
                {selectedTask.type === 'review' && (
                  <button
                    onClick={() => navigate(ROUTES.GAPS)}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-all active:scale-95 shadow-sm"
                  >
                    Review Gaps
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TodaysMission;
