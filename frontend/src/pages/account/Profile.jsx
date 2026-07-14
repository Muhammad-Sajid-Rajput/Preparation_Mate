import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import * as notesApi from '../../api/notesApi';
import * as quizzesApi from '../../api/quizzesApi';
import { updateMe } from '../../api/userApi';
import { handleApiError } from '../../utils/handleApiError';
import { formatDate } from '../../utils/formatDate';
import Skeleton from '../../components/ui/Skeleton';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/layout/PageHeader';

const Profile = () => {
  const { user, setUser, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [goal, setGoal] = useState(user?.goalPreference || 'exam');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch stats on mount
  useEffect(() => {
    refreshUser().catch(() => {});
    Promise.all([
      notesApi.getNotes().catch(() => []),
      quizzesApi.getQuizHistory().catch(() => []),
    ])
      .then(([notes, quizzes]) => {
        const avg = quizzes.length
          ? Math.round(quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length)
          : 0;
        setStats({
          notesCount: notes.length,
          quizCount: quizzes.length,
          avgScore: avg,
          streak: user?.studyStreak ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [user?.studyStreak, refreshUser]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMe({ name, goalPreference: goal });
      setUser(updated); // Update AuthContext
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'SA';
    return fullName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayGoal = (preference) => {
    if (preference === 'exam') return 'Exam Prep';
    if (preference === 'interview') return 'Interview Prep';
    if (preference === 'both') return 'Both';
    return 'Exam Prep';
  };

  return (
    <div className="space-y-6 text-left animate-fade-up">
      <Toaster position="top-right" />

      {/* Page Header */}
      <PageHeader
        icon={User}
        title="Profile"
        subtitle="Your account and learning preferences"
      />

      {/* PROFILE HEADER CARD */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 !p-6 shadow-sm select-none">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold shadow-md shadow-primary/20">
            {getInitials(user?.name)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-on-primary-fixed-variant leading-tight">
                {user?.name || 'User Profile'}
              </h1>
              {user?.studyStreak > 0 && (
                <Badge variant="warning" className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined !text-[12px] fill-amber-700">
                    local_fire_department
                  </span>
                  {user.studyStreak}d streak
                </Badge>
              )}
            </div>
            <p className="text-xs text-primary-fixed-dim font-bold">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-[11px] font-bold text-primary">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined !text-sm">flag</span>
                Goal: {displayGoal(user?.goalPreference)}
              </span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-primary-fixed-dim/40"></span>
              <span className="flex items-center gap-1 text-primary-fixed-dim">
                <span className="material-symbols-outlined !text-sm">calendar_today</span>
                Joined {user?.createdAt ? formatDate(user.createdAt) : 'March 2025'}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setName(user?.name || '');
            setGoal(user?.goalPreference || 'exam');
            setError(null);
            setEditing(true);
          }}
          className="h-9 px-4 text-xs font-semibold"
        >
          Edit profile
        </Button>
      </Card>

      {/* STATS SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-[108px] w-full rounded-xl bg-primary-fixed/30" />
            <Skeleton className="h-[108px] w-full rounded-xl bg-primary-fixed/30" />
            <Skeleton className="h-[108px] w-full rounded-xl bg-primary-fixed/30" />
            <Skeleton className="h-[108px] w-full rounded-xl bg-primary-fixed/30" />
          </>
        ) : (
          <>
            <StatCard
              title="TOTAL NOTES"
              value={stats?.notesCount ?? 0}
              icon="description"
            />
            <StatCard
              title="QUIZZES TAKEN"
              value={stats?.quizCount ?? 0}
              icon="quiz"
            />
            <StatCard
              title="AVG. SCORE"
              value={`${stats?.avgScore ?? 0}%`}
              icon="analytics"
            />
            <StatCard
              title="STREAK"
              value={`${stats?.streak ?? 0} days`}
              icon="local_fire_department"
            />
          </>
        )}
      </div>

      {/* ASYMMETRIC GRID: GOALS & ACHIEVEMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEARNING GOALS */}
        <Card className="md:col-span-1 flex flex-col gap-4 !p-5">
          <div className="flex items-center justify-between pb-2 border-b border-primary-fixed-dim/40 select-none">
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Learning Goal</h2>
            <span className="material-symbols-outlined text-primary text-base">flag</span>
          </div>

          <div className="flex flex-wrap gap-2 select-none">
            <Badge variant="brand">
              {displayGoal(user?.goalPreference)}
            </Badge>
          </div>
          <p className="text-[10px] text-primary-fixed-dim font-semibold mt-1 leading-relaxed text-left">
            You can modify your primary preparation goal in profile settings.
          </p>
        </Card>

        {/* ACHIEVEMENTS */}
        <Card className="md:col-span-2 flex flex-col gap-4 !p-5">
          <div className="flex items-center justify-between pb-2 border-b border-primary-fixed-dim/40 select-none">
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Achievements</h2>
            <span className="material-symbols-outlined text-primary text-base">emoji_events</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-fixed/20 border border-primary-fixed-dim/20 hover:-translate-y-0.5 active:scale-95 duration-200 transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-2 shadow-sm">
                <span
                  className="material-symbols-outlined text-yellow-600 text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  emoji_events
                </span>
              </div>
              <span className="text-xs font-bold text-on-primary-fixed-variant">First Quiz</span>
              <span className="text-[10px] text-primary-fixed-dim font-bold mt-0.5">Completed</span>
            </div>

            <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-fixed/20 border border-primary-fixed-dim/20 hover:-translate-y-0.5 active:scale-95 duration-200 transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2 shadow-sm">
                <span
                  className="material-symbols-outlined text-orange-600 text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  calendar_month
                </span>
              </div>
              <span className="text-xs font-bold text-on-primary-fixed-variant">Daily Habit</span>
              <span className="text-[10px] text-primary-fixed-dim font-bold mt-0.5">{user?.studyStreak || 0} Day Streak</span>
            </div>

            <div className="flex flex-col items-center text-center p-3 rounded-lg bg-primary-fixed/20 border border-primary-fixed-dim/20 hover:-translate-y-0.5 active:scale-95 duration-200 transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2 shadow-sm">
                <span
                  className="material-symbols-outlined text-blue-600 text-[24px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  target
                </span>
              </div>
              <span className="text-xs font-bold text-on-primary-fixed-variant">High Scorer</span>
              <span className="text-[10px] text-primary-fixed-dim font-bold mt-0.5">Score 90%+</span>
            </div>
          </div>
        </Card>
      </div>

      {/* RECENT ACTIVITY */}
      <Card className="!p-5">
        <div className="flex items-center justify-between pb-2 border-b border-primary-fixed-dim/40 mb-4 select-none">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Recent Activity</h2>
          <span className="material-symbols-outlined text-primary text-base">history</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-2.5 rounded-lg hover:bg-primary-fixed/30 transition-colors group">
            <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary-fixed-dim/45 shrink-0"></div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold text-on-primary-fixed-variant">
                Dashboard status active
              </p>
              <p className="text-[10px] text-primary-fixed-dim font-bold mt-0.5">
                Logged in successfully • Just now
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* EDIT PROFILE MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-primary-fixed/95 border border-primary-fixed-dim w-full max-w-md p-6 space-y-4 rounded-xl shadow-[0_20px_50px_rgba(91,106,248,0.15)] animate-fade-up">
            <div className="flex items-center justify-between pb-2 border-b border-primary-fixed-dim/60 select-none">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Edit Profile Details</h3>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="material-symbols-outlined text-primary hover:text-primary-dark w-8 h-8 rounded-full hover:bg-primary-fixed-dim/30 flex items-center justify-center"
              >
                close
              </button>
            </div>

            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block text-left">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                  className="w-full h-10 px-3 bg-white/70 border border-primary-fixed-dim rounded-lg text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2 select-none">
                <label className="text-xs font-bold text-primary uppercase tracking-wider block text-left">
                  Goal Preference
                </label>
                <div className="flex gap-2">
                  {['exam', 'interview', 'both'].map((opt) => {
                    const isSelected = goal === opt;
                    const label =
                      opt === 'exam'
                        ? 'Exam Prep'
                        : opt === 'interview'
                        ? 'Interview Prep'
                        : 'Both';
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setGoal(opt)}
                        disabled={saving}
                        className={`h-8 px-3.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${
                          isSelected
                            ? 'bg-primary text-white border border-primary shadow-sm'
                            : 'border border-primary-fixed-dim/60 text-on-primary-fixed-variant bg-primary-fixed/25 hover:bg-primary-fixed/50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-primary-fixed-dim/40 select-none">
                <Button
                  variant="secondary"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="h-9 px-4 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="h-9 px-5 text-xs shadow-md shadow-primary/10"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
