import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCheck, Calendar, ChevronRight, Plus, ArrowLeft, Mic } from 'lucide-react';
import { getInterviewHistory } from '../../api/careerApi';
import { handleApiError } from '../../utils/handleApiError';
import { formatRelativeTime } from '../../utils/formatDate';
import { ROUTES } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBanner from '../../components/ui/ErrorBanner';
import PageHeader from '../../components/layout/PageHeader';

const InterviewHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInterviewHistory();
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
    navigate(ROUTES.INTERVIEW_QA.replace(':id', item.id), {
      state: { session: item }
    });
  };

  const SessionRowSkeleton = () => (
    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary-fixed-dim/30 last:border-0 animate-pulse">
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-primary-fixed/40 rounded w-1/3" />
        <div className="h-3 bg-primary-fixed/20 rounded w-1/2" />
      </div>
      <div className="h-8 bg-primary-fixed/30 rounded w-24 shrink-0" />
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Card className="space-y-4">
          <div className="pb-2 border-b border-primary-fixed-dim/40 select-none text-left">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Session Logs</h3>
          </div>
          {Array.from({ length: 4 }).map((_, idx) => (
            <SessionRowSkeleton key={idx} />
          ))}
        </Card>
      );
    }

    if (error) {
      return <ErrorBanner message={error.message} onRetry={fetchHistory} />;
    }

    if (history.length === 0) {
      return (
        <EmptyState
          icon={UserCheck}
          heading="No mock sessions taken yet"
          description="Tailor an interview session to start practicing questions and reviewing model answers."
          actionLabel="Start setup"
          onAction={() => navigate(ROUTES.INTERVIEW)}
        />
      );
    }

    return (
      <Card className="space-y-4">
        <div className="pb-2 border-b border-primary-fixed-dim/40 text-left select-none">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Session Logs</h3>
          <p className="text-xs text-primary-fixed-dim font-bold mt-1">Review generated questions, categorize, and critique histories.</p>
        </div>

        <div className="divide-y divide-primary-fixed-dim/30 text-left">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => handleRowClick(item)}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-primary-fixed/30 rounded-lg p-2.5 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <h4 className="text-sm font-bold text-on-primary-fixed-variant truncate">
                  {item.role || 'Software Engineer'}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-primary-fixed-dim font-bold">
                  <span className="flex items-center">
                    <Calendar size={13} className="mr-1" />
                    {formatRelativeTime(item.createdAt || new Date())}
                  </span>
                  <span>•</span>
                  <span>{item.qas?.length || 0} Questions</span>
                  <span>•</span>
                  <Badge variant="brand" className="scale-90 origin-left">
                    {item.experienceLevel || 'Mid-level'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-4 self-end sm:self-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(item);
                  }}
                  className="flex items-center text-xs h-8"
                >
                  Review Q&A <ChevronRight size={12} className="ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 font-sans antialiased text-on-surface animate-fade-up">
      {/* Navigator header */}
      <div className="flex items-center justify-between pb-1 select-none">
        <Link
          to={ROUTES.INTERVIEW}
          className="inline-flex items-center text-xs font-bold text-primary-fixed-dim hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} className="mr-1" /> Back to Setup
        </Link>
      </div>

      <PageHeader
        icon={Mic}
        title="Interview Practice History"
        subtitle="Track performance and read details of past simulated interviews."
        action={
          <Link to={ROUTES.INTERVIEW}>
            <Button variant="primary" size="sm" className="shadow-md shadow-primary/10 flex items-center h-8">
              <Plus size={14} className="mr-1" /> Start New Session
            </Button>
          </Link>
        }
      />

      {/* Main Content */}
      {renderContent()}
    </div>
  );
};

export default InterviewHistory;
