import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileCheck } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/layout/PageHeader';

const ResumeAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysis } = location.state || {};

  // Redirect guard if no analysis state
  useEffect(() => {
    if (!analysis) {
      navigate(ROUTES.RESUME, { replace: true });
    }
  }, [analysis, navigate]);

  if (!analysis) return null;

  const handleDownload = () => {
    window.print();
  };

  const handleUploadRevised = () => {
    navigate(ROUTES.RESUME, {
      state: { role: analysis.role }
    });
  };

  const scorePercent = analysis.atsScore || 0;
  
  // Sort missing keywords: High priority first
  const missingKeywordsSorted = [...(analysis.missingKeywords || [])].sort((a, b) => {
    const aPri = (a.priority || '').toLowerCase() === 'high' ? 1 : 0;
    const bPri = (b.priority || '').toLowerCase() === 'high' ? 1 : 0;
    return bPri - aPri;
  });

  return (
    <div className="space-y-6 font-sans antialiased text-on-surface animate-fade-up">
      <PageHeader
        icon={FileCheck}
        title={analysis.fileName || 'Resume Report'}
        subtitle={`Analyzed ${formatDate(analysis.createdAt || new Date())} · Target: ${analysis.role}`}
        action={
          <div className="flex items-center gap-2 select-none print:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="h-8 text-xs font-semibold flex items-center gap-1 px-3"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Download Report
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUploadRevised}
              className="h-8 text-xs shadow-md shadow-primary/10 flex items-center gap-1 px-3.5"
            >
              <span className="material-symbols-outlined text-[16px]">upload</span>
              Upload Revised
            </Button>
          </div>
        }
      />

      {/* Content Canvas */}
      <div className="max-w-[760px] mx-auto py-2 flex flex-col gap-4 px-4">

        {/* ATS Score Card */}
        <Card className="flex flex-col md:flex-row items-stretch md:items-center gap-8 !p-6">
          {/* Score Circle */}
          <div className="flex flex-col items-center shrink-0 border-b md:border-b-0 md:border-r border-primary-fixed-dim/40 pb-4 md:pb-0 md:pr-8">
            <div className="flex items-baseline">
              <span className="text-[48px] font-bold text-primary font-data-mono leading-none">
                {scorePercent}
              </span>
              <span className="text-[18px] font-bold text-primary-fixed-dim">/100</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1 whitespace-nowrap">
              ATS Match Score
            </span>
          </div>

          {/* Progress Details */}
          <div className="flex-1 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  scorePercent >= 80
                    ? 'success'
                    : scorePercent >= 60
                    ? 'warning'
                    : 'danger'
                }
              >
                {scorePercent >= 80
                  ? 'Strong match'
                  : scorePercent >= 60
                  ? 'Moderate match'
                  : 'Needs work'}
              </Badge>
              <div className="flex-1 h-[6px] bg-[#D6E6F3] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${scorePercent}%`, background: 'linear-gradient(90deg, #0F52BA, #3A7BFF)' }}
                ></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 select-none">
              <Badge variant="gray" className="normal-case">
                Keyword Match: {analysis.keywordMatch || 0}%
              </Badge>
              <Badge variant="success" className="normal-case">
                Format: {analysis.format || 'Good'}
              </Badge>
              <Badge variant="success" className="normal-case">
                Length: {analysis.length || 'Optimal'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* 3-Column Grid: Strengths, Weaknesses, Keywords */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Strengths */}
          <Card className="!p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 select-none">
                <span className="material-symbols-outlined text-emerald-600 text-sm font-bold">
                  thumb_up
                </span>
                <h3 className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                  Strengths
                </h3>
              </div>
              <ul className="space-y-3">
                {analysis.strengths && analysis.strengths.length > 0 ? (
                  analysis.strengths.map((str, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs font-semibold text-on-primary-fixed-variant leading-relaxed"
                    >
                      <span className="material-symbols-outlined text-emerald-500 text-[18px] shrink-0 font-fill-1">
                        check_circle
                      </span>
                      <span>{str}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-primary-fixed-dim font-bold italic">No notable strengths.</p>
                )}
              </ul>
            </div>
          </Card>

          {/* Weaknesses */}
          <Card className="!p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 select-none">
                <span className="material-symbols-outlined text-red-500 text-sm font-bold">
                  thumb_down
                </span>
                <h3 className="text-red-500 text-[10px] font-bold uppercase tracking-wider">
                  Weaknesses
                </h3>
              </div>
              <ul className="space-y-3">
                {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                  analysis.weaknesses.map((weak, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs font-semibold text-on-primary-fixed-variant leading-relaxed"
                    >
                      <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0 font-fill-1">
                        cancel
                      </span>
                      <span>{weak}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-primary-fixed-dim font-bold italic">No weaknesses flagged.</p>
                )}
              </ul>
            </div>
          </Card>

          {/* Missing Keywords */}
          <Card className="!p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 select-none">
                <span className="material-symbols-outlined text-amber-500 text-sm font-bold">
                  label
                </span>
                <h3 className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                  Missing Keywords
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missingKeywordsSorted.length > 0 ? (
                  missingKeywordsSorted.map((kw, idx) => {
                    const isHigh = (kw.priority || '').toLowerCase() === 'high';
                    return (
                      <Badge
                        key={idx}
                        variant={isHigh ? 'danger' : 'warning'}
                        className="normal-case text-[10px] font-bold"
                      >
                        {kw.keyword}
                      </Badge>
                    );
                  })
                ) : (
                  <p className="text-xs text-primary-fixed-dim font-bold italic">No missing keywords identified.</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Recommendations Card */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <Card className="!p-0 overflow-hidden mb-4 border border-primary-fixed-dim/60 shadow-sm">
            <div className="px-4 py-3 border-b border-primary-fixed-dim/60 bg-primary-fixed/30 select-none">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                Before / After improvements
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {analysis.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch rounded-lg overflow-hidden border border-primary-fixed-dim/40 bg-white/70 shadow-sm"
                >
                  <div className="flex-1 p-4 bg-red-50/20 relative border-b sm:border-b-0 sm:border-r border-primary-fixed-dim/30 text-left">
                    <span className="absolute top-2.5 right-2.5 text-[9px] font-bold text-red-500 bg-red-100 px-1 py-0.5 rounded uppercase tracking-wider select-none">
                      Current
                    </span>
                    <p className="text-xs text-red-950 font-semibold italic leading-relaxed pt-3">
                      "{rec.before}"
                    </p>
                  </div>
                  <div className="flex items-center justify-center bg-primary-fixed/20 w-full sm:w-10 py-1 sm:py-0 border-b sm:border-b-0 sm:border-r border-primary-fixed-dim/30">
                    <span className="material-symbols-outlined text-primary text-[18px] select-none">
                      arrow_forward
                    </span>
                  </div>
                  <div className="flex-1 p-4 bg-emerald-50/20 relative text-left">
                    <span className="absolute top-2.5 right-2.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded uppercase tracking-wider select-none">
                      Suggested
                    </span>
                    <p className="text-xs text-emerald-950 font-bold leading-relaxed pt-3">
                      "{rec.after}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalysis;
