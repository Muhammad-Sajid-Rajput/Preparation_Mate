import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import * as gapsApi from '../../api/gapsApi';
import { handleApiError } from '../../utils/handleApiError';
import { getMasteryLevel } from '../../constants/enums';
import { ROUTES } from '../../constants/routes';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/layout/PageHeader';

const KnowledgeGaps = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gapsApi.getGapsReport();
      setReport(data);
      if (data?.topics?.length > 0) {
        setActiveTopic(data.topics[0]);
      } else {
        setActiveTopic(null);
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-pulse">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-8 flex flex-col min-h-0 space-y-6">
            {/* Stat Card Skeletons */}
            <div className="grid grid-cols-3 gap-4 shrink-0 select-none animate-pulse">
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
            {/* Grid Skeleton */}
            <div className="flex-1 min-h-0 bg-[#E8F0F6] border border-primary-fixed-dim/40 rounded-xl" />
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-4 bg-[#E8F0F6] border border-primary-fixed-dim/40 rounded-xl h-full" />
        </div>
      );
    }

    if (error) {
      return <ErrorBanner message={error.message} onRetry={fetchReport} />;
    }

    const topicsList = report?.topics ?? [];

    if (topicsList.length === 0) {
      return (
        <EmptyState
          heading="No data yet"
          description="Complete at least one quiz to see your knowledge gap analysis."
          actionLabel="Take a quiz"
          onAction={() => navigate(ROUTES.NOTES)}
        />
      );
    }

    // Partition topics into columns
    const criticalTopics = topicsList.filter((t) => (t.mastery || 0) < 40);
    const needsWorkTopics = topicsList.filter((t) => (t.mastery || 0) >= 40 && (t.mastery || 0) < 60);
    const goodTopics = topicsList.filter((t) => (t.mastery || 0) >= 60 && (t.mastery || 0) < 80);
    const masteredTopics = topicsList.filter((t) => (t.mastery || 0) >= 80);

    return (
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Mastery Map Section */}
        <section className="lg:col-span-8 text-left flex flex-col min-h-0 overflow-hidden">
          {/* Summary Stats Row */}
          {report?.summary && (
            <div className="grid grid-cols-3 gap-4 mb-4 select-none shrink-0">
              <StatCard
                title="Weak topics"
                value={report.summary.weakTopics || 0}
                icon="warning"
                accentColor="#BA1A1A"
                className="hover:!translate-y-0 hover:!shadow-[0_12px_45px_rgba(15,82,186,0.04)] hover:!border-[#A6C5D7] transition-none"
              />
              <StatCard
                title="Avg mastery"
                value={`${Math.round(report.summary.avgMastery || 0)}%`}
                icon="workspace_premium"
                accentColor="#7C3AED"
                className="hover:!translate-y-0 hover:!shadow-[0_12px_45px_rgba(15,82,186,0.04)] hover:!border-[#A6C5D7] transition-none"
              />
              <StatCard
                title="Topics improving"
                value={report.summary.improving || 0}
                trend="up"
                trendLabel=""
                icon="trending_up"
                accentColor="#16A34A"
                className="hover:!translate-y-0 hover:!shadow-[0_12px_45px_rgba(15,82,186,0.04)] hover:!border-[#A6C5D7] transition-none"
              />
            </div>
          )}

          <div className="flex items-center justify-between mb-4 select-none shrink-0">
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider">Mastery Map</h2>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Column: CRITICAL */}
              <div className="space-y-3">
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#BA1A1A] select-none">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Critical</span>
                </div>
                <div className="space-y-2">
                  {criticalTopics.map((t, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveTopic(t)}
                      className={`bg-red-50/40 border border-primary-fixed-dim/30 border-l-4 border-l-red-500 p-3 rounded-lg shadow-sm hover:shadow hover:bg-red-50/80 hover:-translate-y-0.5 active:scale-95 duration-200 transition-all cursor-pointer ${
                        activeTopic?.name === t.name ? 'ring-2 ring-primary bg-primary-fixed/30' : ''
                      }`}
                    >
                      <p className="text-xs font-bold mb-1 text-on-primary-fixed-variant truncate">
                        {t.name}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="bg-red-100/60 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold select-none">
                          {t.mastery}% Mastery
                        </span>
                        {t.trend === 'down' && (
                          <span className="text-red-600 material-symbols-outlined text-sm font-fill-1">
                            trending_down
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column: NEEDS WORK */}
              <div className="space-y-3">
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#D97706] select-none">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Needs Work</span>
                </div>
                <div className="space-y-2">
                  {needsWorkTopics.map((t, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveTopic(t)}
                      className={`bg-amber-50/40 border border-primary-fixed-dim/30 border-l-4 border-l-amber-500 p-3 rounded-lg shadow-sm hover:shadow hover:bg-amber-50/80 hover:-translate-y-0.5 active:scale-95 duration-200 transition-all cursor-pointer ${
                        activeTopic?.name === t.name ? 'ring-2 ring-primary bg-primary-fixed/30' : ''
                      }`}
                    >
                      <p className="text-xs font-bold mb-1 text-on-primary-fixed-variant truncate">
                        {t.name}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="bg-amber-100/60 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold select-none">
                          {t.mastery}% Mastery
                        </span>
                        {t.trend === 'up' && (
                          <span className="text-green-600 material-symbols-outlined text-sm font-fill-1">
                            trending_up
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column: GOOD */}
              <div className="space-y-3">
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0F52BA] select-none">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Good</span>
                </div>
                <div className="space-y-2">
                  {goodTopics.map((t, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveTopic(t)}
                      className={`bg-primary-fixed/20 border border-primary-fixed-dim/30 border-l-4 border-l-primary p-3 rounded-lg shadow-sm hover:shadow hover:bg-primary-fixed/40 hover:-translate-y-0.5 active:scale-95 duration-200 transition-all cursor-pointer ${
                        activeTopic?.name === t.name ? 'ring-2 ring-primary bg-primary-fixed/30' : ''
                      }`}
                    >
                      <p className="text-xs font-bold mb-1 text-on-primary-fixed-variant truncate">
                        {t.name}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="bg-primary-fixed/40 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold select-none">
                          {t.mastery}% Mastery
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column: MASTERED */}
              <div className="space-y-3">
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#16A34A] select-none">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Mastered</span>
                </div>
                <div className="space-y-2">
                  {masteredTopics.map((t, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveTopic(t)}
                      className={`bg-emerald-50/40 border border-primary-fixed-dim/30 border-l-4 border-l-emerald-500 p-3 rounded-lg shadow-sm hover:shadow hover:bg-emerald-50/80 hover:-translate-y-0.5 active:scale-95 duration-200 transition-all cursor-pointer ${
                        activeTopic?.name === t.name ? 'ring-2 ring-primary bg-primary-fixed/30' : ''
                      }`}
                    >
                      <p className="text-xs font-bold mb-1 text-on-primary-fixed-variant truncate">
                        {t.name}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="bg-emerald-100/60 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold select-none">
                          {t.mastery}% Mastery
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Topic Detail Panel */}
        <aside className="lg:col-span-4 text-left flex flex-col min-h-0">
          {activeTopic && (
            <Card className="h-full flex flex-col justify-between !p-4 border border-primary-fixed-dim/60 shadow-sm animate-fade-up">
              {/* Header */}
              <div className="select-none shrink-0">
                <div className="flex items-start justify-between mb-1.5 gap-2">
                  <h2 className="text-sm font-bold text-on-primary-fixed-variant leading-tight truncate">
                    {activeTopic.name}
                  </h2>
                  <Badge
                    variant={
                      activeTopic.mastery < 40
                        ? 'danger'
                        : activeTopic.mastery < 60
                        ? 'warning'
                        : activeTopic.mastery < 80
                        ? 'brand'
                        : 'success'
                    }
                    className="shrink-0"
                  >
                    {activeTopic.mastery}% mastery
                  </Badge>
                </div>
                <p className="text-primary-fixed-dim font-bold text-[10px] mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px]">history</span>
                  {activeTopic.quizCount || 0} quizzes taken • From: {activeTopic.noteTitle || 'Unknown note'}
                </p>
              </div>

              {/* Trend & Insights */}
              <div className="space-y-3 flex-1 flex flex-col justify-center min-h-0">
                {/* Trend Visualization */}
                <div>
                  <div className="flex items-center justify-between mb-2 select-none">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-primary">Progress Trend</h4>
                    <div
                      className={`flex items-center gap-0.5 ${
                        activeTopic.trend === 'down' ? 'text-red-500' : 'text-emerald-600'
                      }`}
                    >
                      {activeTopic.trend && activeTopic.trend !== 'stable' && (
                        <span className="material-symbols-outlined text-[14px] font-fill-1">
                          {activeTopic.trend === 'down' ? 'trending_down' : 'trending_up'}
                        </span>
                      )}
                      <span className="text-[9px] font-bold capitalize">
                        {activeTopic.trend || 'stable'}
                      </span>
                    </div>
                  </div>
                  <div className="h-14 w-full flex items-end gap-1.5 px-1">
                    {(activeTopic.history ?? []).map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t transition-all duration-300 ${
                          i === (activeTopic.history ?? []).length - 1
                            ? 'bg-primary'
                            : 'bg-primary-fixed-dim/40'
                        }`}
                        style={{ height: `${h.score || 0}%` }}
                        title={`${h.date || ''}: ${h.score || 0}%`}
                      ></div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1 px-1 select-none">
                    <span className="text-[8px] text-primary-fixed-dim font-bold uppercase">Start</span>
                    <span className="text-[8px] text-primary font-bold uppercase">
                      TODAY
                    </span>
                  </div>
                </div>

                {/* AI Insights */}
                {activeTopic.insights && (
                  <div className="p-2.5 bg-primary-fixed/30 border border-primary-fixed-dim/40 rounded-lg select-none">
                    <p className="text-on-primary-fixed-variant font-semibold italic leading-relaxed text-[11px]">
                      {activeTopic.insights}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="space-y-2 mt-3 select-none shrink-0">
                <Button
                  variant="primary"
                  onClick={() =>
                    navigate(ROUTES.QUIZ_GENERATE, {
                      state: {
                        noteId: activeTopic.noteId,
                        topic: activeTopic.name
                      }
                    })
                  }
                  className="w-full flex items-center justify-center gap-2 text-xs h-9 shadow-md shadow-primary/10 hover:!translate-y-0 hover:!shadow-md active:!scale-100"
                >
                  <span className="material-symbols-outlined text-base">target</span>
                  Generate targeted quiz
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigate(ROUTES.CHAT, {
                      state: {
                        noteId: activeTopic.noteId,
                        topic: activeTopic.name
                      }
                    })
                  }
                  className="w-full flex items-center justify-center gap-2 text-xs h-9 hover:!translate-y-0 active:!scale-100"
                >
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                  Ask AI to explain this topic
                </Button>
              </div>
            </Card>
          )}
        </aside>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 font-sans antialiased text-on-surface text-left animate-fade-up">
      {/* Page Header */}
      <div className="shrink-0">
        <PageHeader
          icon={Brain}
          title="Knowledge Gaps"
          subtitle="Your learning intelligence report"
        />
      </div>

      {/* Main Grid Content */}
      {renderContent()}
    </div>
  );
};

export default KnowledgeGaps;
