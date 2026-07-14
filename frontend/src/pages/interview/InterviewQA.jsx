import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic } from 'lucide-react';
import toast from 'react-hot-toast';
import { setupInterview } from '../../api/careerApi';
import { handleApiError } from '../../utils/handleApiError';
import { formatDate } from '../../utils/formatDate';
import { ROUTES } from '../../constants/routes';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/layout/PageHeader';

const InterviewQA = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = location.state || {};

  // Guard: if no session, redirect back to interview setup page
  useEffect(() => {
    if (!session) {
      navigate(ROUTES.INTERVIEW, { replace: true });
    }
  }, [session, navigate]);

  const [reviewed, setReviewed] = useState({});
  const [expanded, setExpanded] = useState({});
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!session) return null;

  const qas = session.qas || [];
  const reviewedCount = Object.values(reviewed).filter(Boolean).length;
  const progressPercent = qas.length > 0 ? Math.round((reviewedCount / qas.length) * 100) : 0;

  const toggleReviewed = (questionId) => {
    setReviewed((prev) => {
      const nextVal = !prev[questionId];
      toast.success(nextVal ? 'Marked as reviewed' : 'Marked as unreviewed');
      return { ...prev, [questionId]: nextVal };
    });
  };

  const toggleExpanded = (questionId) => {
    setExpanded((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleRegenerateConfirm = async () => {
    setIsRegenerating(true);
    setShowRegenConfirm(false);
    try {
      const newSession = await setupInterview({
        role: session.role,
        experienceLevel: session.experienceLevel,
        specialization: session.specialization,
        count: qas.length
      });
      toast.success('Questions regenerated successfully!');
      navigate(ROUTES.INTERVIEW_QA.replace(':id', newSession.id), {
        state: { session: newSession },
        replace: true
      });
    } catch (err) {
      toast.error('Could not regenerate questions. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const getCategoryVariant = (cat) => {
    const clean = (cat || '').toLowerCase();
    if (clean.includes('technical')) return 'brand';
    if (clean.includes('behavioral')) return 'warning';
    return 'gray';
  };

  return (
    <div className="space-y-6 font-sans antialiased text-on-surface animate-fade-up">
      <PageHeader
        icon={Mic}
        title={`${session.role} · ${session.experienceLevel}`}
        subtitle={`${qas.length} questions generated · ${formatDate(session.createdAt || new Date())}`}
        action={
          <div className="flex gap-2 select-none">
            <Button
              variant="secondary"
              onClick={() => setShowRegenConfirm(true)}
              disabled={isRegenerating}
              className="h-9 px-4 flex items-center gap-1.5 text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Regenerate
            </Button>
          </div>
        }
      />

      <div className="w-full max-w-4xl mx-auto px-4 select-none">

      {/* Progress Tracker */}
      <div className="flex items-center gap-4 mb-6 select-none">
        <span className="text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap">
          {reviewedCount} of {qas.length} reviewed
        </span>
        <div className="w-[300px] h-[6px] bg-[#D6E6F3] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Question Accordion List */}
      <section className="flex flex-col gap-3">
        {qas.map((qa, idx) => {
          const isExpanded = !!expanded[qa.id];
          const isReviewed = !!reviewed[qa.id];

          return (
            <article
              key={qa.id || idx}
              className="premium-card !p-0 border border-primary-fixed-dim/60 shadow-sm overflow-hidden bg-white/70 hover:border-primary/30 transition-all duration-200"
            >
              {/* Accordion Trigger Header */}
              <div
                className="flex items-center min-h-[56px] py-2 px-4 cursor-pointer hover:bg-primary-fixed/20 transition-colors justify-between gap-3 select-none"
                onClick={() => toggleExpanded(qa.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant={getCategoryVariant(qa.category)}>
                    {qa.category || 'Q'}
                  </Badge>
                  <h3 className="text-xs font-bold text-on-primary-fixed-variant truncate pr-1">
                    {qa.question}
                  </h3>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  {qa.difficulty && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-primary-fixed/40 text-primary border border-primary-fixed-dim/30 rounded">
                      {qa.difficulty}
                    </span>
                  )}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleReviewed(qa.id);
                    }}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isReviewed
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-primary-fixed-dim bg-white hover:border-primary hover:bg-primary-fixed/30'
                    }`}
                  >
                    {isReviewed && (
                      <span className="material-symbols-outlined text-white text-[12px] font-bold">
                        check
                      </span>
                    )}
                  </div>
                  <span
                    className={`material-symbols-outlined text-primary transition-transform duration-300 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </div>
              </div>

              {/* Accordion Content Panel */}
              {isExpanded && (
                <div className="p-5 bg-primary-fixed/20 border-t border-primary-fixed-dim/40 animate-fade-up">
                  <p className="text-xs font-bold text-on-primary-fixed-variant mb-4 leading-relaxed">
                    {qa.question}
                  </p>
                  <hr className="border-t border-primary-fixed-dim/40 mb-4" />
                  <span className="block text-[10px] font-bold tracking-wider text-primary uppercase mb-2 select-none">
                    MODEL ANSWER
                  </span>
                  <p className="text-xs font-semibold text-on-primary-fixed-variant leading-relaxed max-w-3xl whitespace-pre-wrap">
                    {qa.modelAnswer}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Regeneration Confirm Dialog */}
      <ConfirmDialog
        open={showRegenConfirm}
        title="Regenerate questions?"
        body="The current questions will be replaced."
        confirmLabel="Regenerate"
        danger={true}
        onConfirm={handleRegenerateConfirm}
        onCancel={() => setShowRegenConfirm(false)}
      />
      </div>
    </div>
  );
};

export default InterviewQA;
