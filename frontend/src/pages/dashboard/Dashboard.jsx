import React, { useState, useCallback, useEffect, useContext } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/layout/PageHeader';
import { AuthContext } from '../../context/AuthContext';
import { getGapsReport } from '../../api/gapsApi';
import * as notesApi from '../../api/notesApi';
import * as quizzesApi from '../../api/quizzesApi';
import * as plannerApi from '../../api/plannerApi';
import TodaysMission from '../../components/planner/TodaysMission';

// Derives a synthetic activity feed from real notes + quiz data
const buildActivityFeed = (notes = [], quizzes = []) => {
  const noteItems = notes.slice(0, 4).map((n) => ({
    id: `note-${n.id || n._id}`,
    type: 'upload',
    text: `Uploaded notes: "${n.title}"`,
    timestamp: n.createdAt,
    meta: `${n.chunkCount || 0} chunks indexed`,
  }));

  const quizItems = quizzes.slice(0, 4).map((q) => ({
    id: `quiz-${q.id || q._id}`,
    type: 'quiz',
    text: `Completed quiz: "${q.title}"`,
    timestamp: q.createdAt || q.completedAt,
    meta: q.results?.score != null ? `Score: ${Math.round(q.results.score)}%` : 'No score yet',
  }));

  return [...noteItems, ...quizItems]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 12);
};

// Short day labels for the streak widget
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Shimmer skeleton row for knowledge gaps loading state
const GapSkeleton = () => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <div className="h-3.5 w-32 bg-primary-fixed-dim/60 rounded animate-shimmer" />
      <div className="h-3.5 w-12 bg-primary-fixed-dim/60 rounded animate-shimmer" />
    </div>
    <div className="h-1.5 w-full bg-primary-fixed-dim/40 rounded-full animate-shimmer" />
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext);
  const { notes } = useOutletContext();

  // Real stats state with "--" defaults
  const [notesCount, setNotesCount] = useState('--');
  const [quizCount, setQuizCount] = useState('--');
  const [avgScore, setAvgScore] = useState('--');

  // Activity feed
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Quizzes state
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);

  // Gaps state
  const [gaps, setGaps] = useState([]);
  const [gapsLoading, setGapsLoading] = useState(true);

  // Planner states
  const [plan, setPlan] = useState(null);
  const [readinessScore, setReadinessScore] = useState('--');

  // Fetch statistics and list data on mount (excluding notes)
  useEffect(() => {
    // Refresh user profile to ensure streak is up-to-date
    refreshUser().catch(() => {});

    // A. Fetch gaps report
    getGapsReport()
      .then((report) => {
        const topicsList = report?.topics || [];
        setGaps(
          topicsList
            .map((t) => ({ name: t.name, mastery: t.mastery, noteId: t.noteId }))
            .filter((t) => t.mastery < 60)
            .sort((a, b) => a.mastery - b.mastery)
            .slice(0, 10)
        );
      })
      .catch(() => { })
      .finally(() => setGapsLoading(false));

    // B. Fetch quizzes
    quizzesApi.getQuizHistory()
      .then((history) => {
        setQuizzes(Array.isArray(history) ? history : []);
      })
      .catch(() => { })
      .finally(() => setQuizzesLoading(false));

    // C. Fetch planner tasks
    plannerApi.getPlan()
      .then((planData) => {
        setPlan(planData);
        if (planData) {
          plannerApi.getReadinessScore()
            .then(data => {
              if (data && typeof data.score !== 'undefined') {
                setReadinessScore(data.score);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        setPlan(null);
      });
  }, []);

  // Reactively update notes statistics and activity feed
  useEffect(() => {
    if (notes !== null) {
      setNotesCount(notes.length);
      const quizzesList = Array.isArray(quizzes) ? quizzes : [];
      if (quizzesList.length > 0) {
        setQuizCount(quizzesList.length);
        const total = quizzesList.reduce((sum, q) => sum + (q.results?.score ?? q.score ?? 0), 0);
        setAvgScore(`${Math.round(total / quizzesList.length)}%`);
      } else {
        setQuizCount(0);
        setAvgScore('--');
      }
      setActivities(buildActivityFeed(notes, quizzesList));
      setActivitiesLoading(quizzesLoading);
    }
  }, [notes, quizzes, quizzesLoading]);

  const getWeeklyHoursValue = () => {
    if (!plan || !plan.tasks) return '--';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday...
    // Start of current week (assuming Monday start)
    const startOfWeek = new Date(today);
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);

    const weeklyTasks = plan.tasks.filter(t => 
      t.completed && 
      t.completedAt && 
      new Date(t.completedAt) >= startOfWeek
    );
    const totalMins = weeklyTasks.reduce((sum, t) => sum + (t.estimatedMins || 30), 0);
    const hrs = (totalMins / 60).toFixed(1);
    return `${hrs}h`;
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.name?.split(' ')[0] || 'there';
  const streak = user?.studyStreak ?? 0;

  // Build 7-day dot row (today = last dot)
  const today = new Date().getDay(); // 0=Sun … 6=Sat, we want Mon=0
  const todayIdx = (today + 6) % 7; // shift so Mon=0, Sun=6
  const filledDots = Math.min(streak, 7);

  const daysLeft = plan?.examDate ? Math.max(0, Math.ceil((new Date(plan.examDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        subtitle="Your study overview for today"
      />

      {/* ROW 1: WELCOME + STREAK */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-12 premium-card flex flex-col md:flex-row items-center justify-between animate-fade-up animation-delay-75">
          <div className="flex flex-col text-left">
            <h2 className="text-[18px] font-bold text-on-primary-fixed leading-tight">
              {getGreeting()}, {displayName}. 🌤
            </h2>
            <p className="text-[13px] text-on-primary-fixed-variant mt-1">
              Welcome back to your personalized study desk. Let's make progress today.
            </p>
          </div>

          {/* 7-day Streak Widget */}
          <div className="flex items-center gap-5 mt-4 md:mt-0 px-5 py-3 bg-primary/8 border border-amber-200/60 rounded-xl">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-amber-600">
                <span className="material-symbols-outlined font-fill-1 !text-[22px]">local_fire_department</span>
                <span className="font-data-mono text-[22px] font-extrabold leading-none">{streak}</span>
              </div>
              <span className="text-[10px] text-on-primary-fixed-variant/60 font-semibold mt-0.5">day streak</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                {DAY_LABELS.map((day, i) => {
                  const isFilled = i <= todayIdx && (todayIdx - i) < filledDots;
                  const isToday = i === todayIdx;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-3 h-3 rounded-full transition-all ${isToday
                            ? 'ring-2 ring-[#0F52BA] ring-offset-1 bg-amber-500'
                            : isFilled
                              ? 'bg-amber-500'
                              : 'bg-[#D6E6F3]'
                          }`}
                      />
                      <span className="text-[9px] font-bold text-on-primary-fixed-variant/50">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: STAT CARDS — 5 columns if plan exists, else 4 */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${plan ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6`}>
        <StatCard
          className="animate-fade-up animation-delay-100"
          title="Notes uploaded"
          value={notesCount}
          icon="description"
          accentColor="#0F52BA"
          trend="none"
        />
        <StatCard
          className="animate-fade-up animation-delay-150"
          title="Quizzes taken"
          value={quizCount}
          icon="quiz"
          accentColor="#7C3AED"
          trend="none"
        />
        <StatCard
          className="animate-fade-up animation-delay-200"
          title="Avg score"
          value={avgScore}
          icon="emoji_events"
          accentColor="#D97706"
          trend="none"
        />
        <StatCard
          className="animate-fade-up animation-delay-250"
          title="Study this week"
          value={getWeeklyHoursValue()}
          icon="schedule"
          accentColor="#16A34A"
          trend="none"
        />
        {plan && (
          <div className="premium-card flex flex-col justify-between overflow-hidden relative !pt-[14px] !pb-3 !px-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
              style={{
                background: readinessScore === '--' ? '#5B6775'
                          : readinessScore >= 70 ? '#16A34A'
                          : readinessScore >= 40 ? '#D97706'
                          : '#DC2626'
              }}
            />
            <div className="flex items-center justify-between mb-1 select-none">
              <span className="text-[10px] uppercase tracking-wider text-on-primary-fixed-variant/80 font-bold">
                EXAM READINESS
              </span>
              <span className="material-symbols-outlined !text-[18px]" style={{
                color: readinessScore === '--' ? '#5B6775'
                     : readinessScore >= 70 ? '#16A34A'
                     : readinessScore >= 40 ? '#D97706'
                     : '#DC2626'
              }}>
                assessment
              </span>
            </div>
            <div className="flex flex-col mt-0.5 text-left">
              <span className="font-data-mono text-[22px] font-extrabold tabular-nums tracking-tight text-on-primary-fixed leading-none">
                {readinessScore !== '--' ? `${readinessScore}%` : '--'}
              </span>
              <span className="text-[10px] text-on-primary-fixed-variant/60 font-semibold mt-1 truncate" title={`${plan.examName} · ${daysLeft} days`}>
                {plan.examName} · {daysLeft} days
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ROW 3: KNOWLEDGE GAPS + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Knowledge Gaps */}
        <div className="lg:col-span-7 premium-card flex flex-col animate-fade-up animation-delay-250">
          <div className="flex items-center justify-between mb-6">
            <div className="pm-section-label">
              <h3 className="text-[13px] font-bold text-on-primary-fixed">Knowledge Gaps</h3>
            </div>
            <button
              onClick={() => navigate('/app/gaps')}
              className="text-primary text-[12px] font-bold hover:underline flex items-center gap-0.5"
            >
              View All
              <span className="material-symbols-outlined !text-[14px]">chevron_right</span>
            </button>
          </div>
          <div className="space-y-6 h-[180px] overflow-y-auto text-left scrollbar-hide">
            {gapsLoading ? (
              <>
                <GapSkeleton />
                <GapSkeleton />
                <GapSkeleton />
              </>
            ) : gaps.length === 0 ? (
              <div className="text-body text-on-primary-fixed-variant py-4">
                No weak topics found (mastery below 60%). Great job!
              </div>
            ) : (
              gaps.map((topic, index) => {
                const colorClass = topic.mastery < 40 ? 'text-[#DC2626]' : 'text-[#D97706]';
                const barColor = topic.mastery < 40 ? 'bg-[#DC2626]' : 'bg-[#D97706]';
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="font-semibold text-on-primary-fixed">{topic.name}</span>
                      <div className="flex items-center gap-4">
                        <span className={`font-data-mono font-bold ${colorClass}`}>
                          {topic.mastery}%
                        </span>
                        <button
                          onClick={() =>
                            navigate('/app/quizzes/generate', {
                              state: { noteId: topic.noteId, topic: topic.name },
                            })
                          }
                          className="px-3 py-1 bg-primary text-white rounded-full text-tiny font-bold hover:shadow-md hover:shadow-primary/20 active:scale-95 duration-200 transition-all"
                        >
                          Practice
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-white/50 border border-primary-fixed-dim/40 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${barColor}`}
                        style={{ width: `${topic.mastery}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6 animate-fade-up animation-delay-300">
          <div className="premium-card flex-1">
            <div className="pm-section-label mb-5">
              <h3 className="text-[13px] font-bold text-on-primary-fixed">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left">
              <button
                onClick={() => navigate('/app/notes')}
                className="flex flex-col items-start p-3 bg-white/70 border border-primary-fixed-dim/60 rounded-lg hover:border-primary hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left w-full transition-all duration-200"
              >
                <span className="material-symbols-outlined text-primary mb-2">upload_file</span>
                <span className="text-[13px] font-bold text-on-primary-fixed">Upload Notes</span>
                <span className="text-tiny text-on-primary-fixed-variant/70">PDF only</span>
              </button>
              <button
                onClick={() => navigate('/app/quizzes/generate')}
                className="flex flex-col items-start p-3 bg-white/70 border border-primary-fixed-dim/60 rounded-lg hover:border-primary hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left w-full transition-all duration-200"
              >
                <span className="material-symbols-outlined text-primary mb-2">auto_awesome</span>
                <span className="text-[13px] font-bold text-on-primary-fixed">Take a Quiz</span>
                <span className="text-tiny text-on-primary-fixed-variant/70">AI Generated</span>
              </button>
              <button
                onClick={() => navigate('/app/chat')}
                className="flex flex-col items-start p-3 bg-white/70 border border-primary-fixed-dim/60 rounded-lg hover:border-primary hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left w-full transition-all duration-200"
              >
                <span className="material-symbols-outlined text-primary mb-2">forum</span>
                <span className="text-[13px] font-bold text-on-primary-fixed">Ask AI</span>
                <span className="text-tiny text-on-primary-fixed-variant/70">Chat with Assistant</span>
              </button>
              <button
                onClick={() => navigate('/app/planner')}
                className="flex flex-col items-start p-3 bg-white/70 border border-primary-fixed-dim/60 rounded-lg hover:border-primary hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-left w-full transition-all duration-200"
              >
                <span className="material-symbols-outlined text-primary mb-2">event_note</span>
                <span className="text-[13px] font-bold text-on-primary-fixed">Today's Plan</span>
                <span className="text-tiny text-on-primary-fixed-variant/70">Review schedule</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4: RECENT ACTIVITY + TODAY'S MISSION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-7 premium-card text-left animate-fade-up animation-delay-350">
          <div className="pm-section-label mb-6">
            <h3 className="text-[13px] font-bold text-on-primary-fixed">Recent Activity</h3>
          </div>
          <div className="space-y-4 h-[180px] overflow-y-auto scrollbar-hide">
            {activitiesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim/60 animate-shimmer shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="h-3 w-48 bg-primary-fixed-dim/60 rounded animate-shimmer" />
                      <div className="h-2.5 w-28 bg-primary-fixed-dim/40 rounded animate-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="py-6 text-center">
                <span className="material-symbols-outlined text-on-primary-fixed-variant/40 text-4xl mb-2 block">
                  inbox
                </span>
                <p className="text-body text-on-primary-fixed-variant">
                  No activity yet. Upload some notes or take a quiz!
                </p>
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex gap-4 items-center animate-fade-in">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${act.type === 'quiz' ? 'bg-primary'
                      : act.type === 'upload' ? 'bg-green-500'
                        : 'bg-outline-variant'
                      }`}
                  />
                  <div className="flex flex-col">
                    <p className="text-body font-semibold text-on-primary-fixed">{act.text}</p>
                    <p className="text-tiny text-on-primary-fixed-variant/70">
                      {act.meta} • {formatTime(act.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Mission Widget */}
        <div className="lg:col-span-5 flex flex-col justify-stretch animate-fade-up animation-delay-400">
          <TodaysMission compact={true} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
