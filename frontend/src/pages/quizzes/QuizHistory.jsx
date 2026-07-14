import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ClipboardList, ChevronRight } from 'lucide-react';
import * as quizzesApi from '../../api/quizzesApi';
import { handleApiError } from '../../utils/handleApiError';
import { formatRelativeTime } from '../../utils/formatDate';
import { getScoreColor } from '../../utils/formatScore';
import { ROUTES } from '../../constants/routes';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBanner from '../../components/ui/ErrorBanner';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/ui/StatCard';

const QuizHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quizzesApi.getQuizHistory();
      setHistory(data || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRowClick = (item) => {
    navigate(ROUTES.QUIZ_RESULTS.replace(':id', item.id), {
      state: { results: item.results, quiz: item }
    });
  };

  const getScoreTextClass = (score) => {
    if (score >= 80) {
      return 'text-[#16A34A] bg-[#DCFCE7] border-[#16A34A]/25';
    }
    if (score >= 60) {
      return 'text-[#D97706] bg-[#FFFBEB] border-[#D97706]/25';
    }
    return 'text-[#DC2626] bg-[#FEE2E2] border-[#DC2626]/25';
  };

  const getDiffPill = (diff) => {
    const d = (diff || 'medium').toLowerCase();
    if (d === 'easy') {
      return (
        <span className="px-2 py-0.5 bg-[#D6E6F3] text-[#0F52BA] rounded text-[10px] font-bold">
          Easy
        </span>
      );
    }
    if (d === 'hard') {
      return (
        <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#BA1A1A] rounded text-[10px] font-bold">
          Hard
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-[#E8F0F6] text-[#5B6775] rounded text-[10px] font-bold">
        Medium
      </span>
    );
  };

  const getTypeLabel = (type) => {
    const t = type || 'multiple_choice';
    if (t === 'true_false' || t === 'true-false') return 'T/F';
    if (t === 'mixed') return 'Mixed';
    return 'MCQ';
  };

  const RowSkeleton = () => (
    <div className="grid grid-cols-12 min-h-[56px] items-center gap-3 px-4 border-b last:border-0 border-primary-fixed-dim/50 animate-pulse">
      {/* Quiz info */}
      <div className="col-span-5 flex flex-col gap-2 py-2 text-left">
        <div className="h-[12px] bg-[#E8F0F6] rounded-md w-[220px]" />
        <div className="h-[9px] bg-[#E8F0F6] rounded-md w-[140px]" />
      </div>

      {/* Details (centered) */}
      <div className="col-span-2 flex flex-col gap-2 items-center justify-center py-2">
        <div className="h-[18px] bg-[#E8F0F6] rounded-md w-14" />
        <div className="h-[8px] bg-[#E8F0F6] rounded-md w-8" />
      </div>

      {/* Score */}
      <div className="col-span-3 flex items-center gap-3">
        <div className="flex-1 bg-[#E8F0F6] h-[6px] rounded-full" />
        <div className="h-[18px] w-12 bg-[#E8F0F6] rounded-full shrink-0" />
      </div>

      {/* Activity */}
      <div className="col-span-2 flex items-center justify-end gap-3">
        <div className="h-[14px] w-14 bg-[#E8F0F6] rounded-md shrink-0" />
        <div className="h-[14px] w-[32px] bg-[#E8F0F6] rounded-md shrink-0" />
      </div>
    </div>
  );

  /* Summary stats calculations */
  const avgScore = history.length
    ? Math.round(history.reduce((s, i) => s + (i.score || 0), 0) / history.length)
    : null;
  const totalQ = history.reduce((s, i) => s + (i.totalQuestions || i.questions?.length || 0), 0);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="premium-card flex-1 min-h-0 flex flex-col overflow-hidden p-0 text-left hover:translate-y-0 hover:shadow-[0_12px_45px_rgba(15,82,186,0.04)] hover:border-[#A6C5D7] transition-all duration-300">
          <div className="grid grid-cols-12 h-10 items-center gap-3 px-4 bg-primary-fixed-dim/40 border-b border-primary-fixed-dim select-none shrink-0">
            <div className="col-span-5 text-overline text-on-primary-fixed-variant font-bold">Quiz</div>
            <div className="col-span-2 text-overline text-on-primary-fixed-variant font-bold text-center">Details</div>
            <div className="col-span-3 text-overline text-on-primary-fixed-variant font-bold">Score</div>
            <div className="col-span-2 text-overline text-on-primary-fixed-variant font-bold text-right">Activity</div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-primary-fixed-dim/50">
            {Array.from({ length: 5 }).map((_, idx) => (
              <RowSkeleton key={idx} />
            ))}
          </div>
        </div>
      );
    }

    if (error) {
      return <ErrorBanner message={error.message} onRetry={fetchHistory} />;
    }

    if (history.length === 0) {
      return (
        <EmptyState
          icon={Award}
          heading="No quizzes taken yet"
          description="Create a quiz or upload study materials to assess your learning progress."
          actionLabel="Generate a quiz"
          onAction={() => navigate(ROUTES.NOTES)}
        />
      );
    }

    return (
      <div className="premium-card flex-1 min-h-0 flex flex-col overflow-hidden p-0 text-left hover:translate-y-0 hover:shadow-[0_12px_45px_rgba(15,82,186,0.04)] hover:border-[#A6C5D7] transition-all duration-300">
        {/* Column headers */}
        <div className="grid grid-cols-12 h-10 items-center gap-3 px-4 bg-primary-fixed-dim/40 border-b border-primary-fixed-dim select-none shrink-0">
          <div className="col-span-5 text-overline text-on-primary-fixed-variant font-bold">Quiz</div>
          <div className="col-span-2 text-overline text-on-primary-fixed-variant font-bold text-center">Details</div>
          <div className="col-span-3 text-overline text-on-primary-fixed-variant font-bold">Score</div>
          <div className="col-span-2 text-overline text-on-primary-fixed-variant font-bold text-right">Activity</div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-primary-fixed-dim/50">
          {history.map((item) => {
            const score = item.score || item.results?.score || 0;
            return (
              <div
                key={item.id}
                onClick={() => handleRowClick(item)}
                className="grid grid-cols-12 min-h-[56px] items-center gap-3 px-4 border-b last:border-0 border-primary-fixed-dim/50 hover:bg-white/50 transition-colors group cursor-pointer"
              >
                <div className="col-span-5 flex flex-col justify-center py-2 text-left">
                  <span className="text-on-primary-fixed font-bold text-[13px] truncate max-w-[280px]">
                    {item.subject || item.title || 'Quiz'}
                  </span>
                  <span className="text-[11px] text-[#5B6775] font-semibold mt-1 truncate max-w-[280px]">
                    {item.noteTitle ? `From: ${item.noteTitle}` : 'Custom Quiz'}
                  </span>
                </div>
                <div className="col-span-2 flex flex-col gap-1 items-center justify-center py-2">
                  {getDiffPill(item.difficulty)}
                  <span className="text-[10px] font-bold text-[#5B6775] uppercase font-sans tracking-wide">
                    {getTypeLabel(item.quizType)}
                  </span>
                </div>
                <div className="col-span-3 flex items-center gap-3">
                  <div className="flex-1 bg-white/50 border border-primary-fixed-dim/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${score}%`,
                        backgroundColor: getScoreColor(score)
                      }}
                    ></div>
                  </div>
                  <span className={`text-tiny font-bold ${getScoreTextClass(score)} px-2 py-0.5 rounded-full border`}>
                    {score}%
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span className="text-tiny text-on-primary-fixed-variant/70 font-semibold whitespace-nowrap">
                    {formatRelativeTime(item.completedAt || item.createdAt)}
                  </span>
                  <ChevronRight
                    className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 shrink-0"
                    strokeWidth={2}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 font-sans antialiased text-on-background">
      {/* Page Header */}
      <div className="shrink-0">
        <PageHeader
          icon={ClipboardList}
          title="Quizzes"
          subtitle="Test your knowledge and track your scores"
          action={
            <button
              onClick={() => navigate('/app/quizzes/generate')}
              className="h-btn_height_default px-4 premium-btn-primary rounded-lg flex items-center gap-2 font-bold hover:shadow-lg active:scale-95 transition-all duration-200 text-[13px]"
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              Generate Quiz
            </button>
          }
        />
      </div>

      {/* Summary stats — show skeleton when loading, or real cards when loaded */}
      {loading ? (
        <div className="grid grid-cols-3 gap-6 shrink-0 select-none animate-pulse">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="premium-card flex flex-col justify-between overflow-hidden relative !pt-[14px] !pb-3 !px-4 h-[78px] border-primary-fixed-dim/50"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="h-3 bg-[#E8F0F6] rounded w-20" />
                <div className="h-4 w-4 bg-[#E8F0F6] rounded" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="h-7 bg-[#E8F0F6] rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        !error && history.length > 0 && (
          <div className="grid grid-cols-3 gap-6 shrink-0 select-none">
            <StatCard title="Quizzes taken" value={history.length} icon="quiz" accentColor="#7C3AED" />
            <StatCard title="Average score" value={`${avgScore}%`} icon="emoji_events" accentColor="#D97706" />
            <StatCard title="Questions answered" value={totalQ} icon="local_fire_department" accentColor="#16A34A" />
          </div>
        )
      )}

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default QuizHistory;
