import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { getScoreLabel, getScoreColor, calcStrokeDashoffset } from '../../utils/formatScore';
import { getMasteryLevel } from '../../constants/enums';
import { ROUTES } from '../../constants/routes';
import MasteryBar from '../../components/ui/MasteryBar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/layout/PageHeader';

const QuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, quiz } = location.state || {};

  // Redirect guard if no results
  useEffect(() => {
    if (!results || !quiz) {
      navigate(ROUTES.QUIZZES, { replace: true });
    }
  }, [results, quiz, navigate]);

  const [expandedIdx, setExpandedIdx] = useState(null);

  if (!results || !quiz) return null;

  const scorePercent = results.score || 0;
  const correctCount = results.correct || 0;
  const incorrectCount = results.incorrect || 0;
  const skippedCount = results.skipped || 0;
  const totalCount = quiz.questions?.length || correctCount + incorrectCount + skippedCount;
  
  const gradeTitle = getScoreLabel(scorePercent);
  const gradeColor = getScoreColor(scorePercent);

  // Circumference for radius 37 is 232.478
  const strokeDashoffset = calcStrokeDashoffset(scorePercent, 37);

  const formatTimeTaken = (seconds) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const toggleExpand = (idx) => {
    setExpandedIdx(expandedIdx === idx ? null : idx);
  };

  return (
    <div className="space-y-6 font-sans antialiased text-on-surface animate-fade-up">
      <PageHeader
        icon={ClipboardList}
        title={`${quiz.title || quiz.subject || 'Quiz'} — Results`}
        subtitle={`Completed ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
      />

      <div className="max-w-[720px] mx-auto px-4 select-none text-left">

      {/* Score Card */}
      <Card className="flex flex-col sm:flex-row items-center gap-6 mb-4 !p-5">
        {/* Circular Score Ring */}
        <div className="relative w-[90px] h-[90px] flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-full border-[8px] border-primary-fixed-dim/30"></div>
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="45"
              cy="45"
              fill="none"
              r="37"
              stroke={gradeColor}
              strokeDasharray="232.478"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="8"
            ></circle>
          </svg>
          <span className="text-2xl font-bold" style={{ color: gradeColor }}>
            {scorePercent}%
          </span>
        </div>
        {/* Score Details */}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-base font-bold uppercase tracking-wide" style={{ color: gradeColor }}>
            {gradeTitle}
          </h2>
          <p className="text-xs text-on-primary-fixed-variant font-semibold mt-1 mb-3">
            {correctCount} of {totalCount} correct · {formatTimeTaken(results.timeTaken)} · {quiz.title || quiz.subject || 'Quiz'}
          </p>
          <div className="flex gap-2 justify-center sm:justify-start flex-wrap">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200/50 rounded-full text-[10px] font-bold flex items-center gap-1">
              ✅ {correctCount} correct
            </span>
            <span className="px-2.5 py-0.5 bg-red-100 text-red-700 border border-red-200/50 rounded-full text-[10px] font-bold flex items-center gap-1">
              ❌ {incorrectCount} incorrect
            </span>
            {skippedCount > 0 && (
              <span className="px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed-variant border border-primary-fixed-dim/20 rounded-full text-[10px] font-bold flex items-center gap-1">
                ⏭ {skippedCount} skipped
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Topic Breakdown Card */}
      {results.topicBreakdown && results.topicBreakdown.length > 0 && (
        <Card className="mb-4 !p-5">
          <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">
            Topic breakdown
          </h3>
          <div className="flex flex-col gap-3">
            {results.topicBreakdown.map((item, index) => {
              const mastery = getMasteryLevel(item.score);
              const icon = item.score >= 80 ? '✅' : item.score >= 60 ? '⚠️' : '❌';
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-on-primary-fixed-variant font-bold truncate max-w-[200px]">{item.topic}</span>
                    <span style={{ color: mastery.color }} className="font-bold">
                      {item.score}% {icon}
                    </span>
                  </div>
                  <MasteryBar value={item.score} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Next Steps Card */}
      <Card className="mb-4 !p-5">
        <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">
          What to do next
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              navigate(ROUTES.QUIZ_TAKING.replace(':id', quiz.id), {
                state: { quiz }
              })
            }
            className="flex-1 flex items-center justify-center gap-2 text-xs"
          >
            <span className="material-symbols-outlined text-base">replay</span>
            Retake quiz
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              navigate(ROUTES.QUIZ_GENERATE, {
                state: {
                  noteId: quiz.noteId,
                  topics: (results.topicBreakdown ?? [])
                    .filter((t) => t.score < 60)
                    .map((t) => t.topic)
                }
              })
            }
            className="flex-1 flex items-center justify-center gap-2 text-xs shadow-md shadow-primary/10"
          >
            <span className="material-symbols-outlined text-base">track_changes</span>
            Practice weak topics
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              navigate(ROUTES.PLANNER_CREATE, {
                state: {
                  topic: quiz.subject,
                  weakTopics: (results.topicBreakdown ?? [])
                    .filter((t) => t.score < 60)
                    .map((t) => t.topic)
                }
              })
            }
            className="flex-1 flex items-center justify-center gap-2 text-xs"
          >
            <span className="material-symbols-outlined text-base">calendar_add_on</span>
            Add to study plan
          </Button>
        </div>
      </Card>

      {/* Detailed Review Section */}
      {results.questionReview && results.questionReview.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-[11px] font-bold text-primary uppercase tracking-wider pl-2 border-l-2 border-primary">
            Detailed Answers Review
          </h3>

          {results.questionReview.map((item, idx) => {
            const isExpanded = expandedIdx === idx;
            // Lookup original options from quiz object questions list
            const originalQuestion =
              quiz.questions?.find((q) => q.questionText === item.question || q.id === item.id) ||
              {};
            
            const isTF = quiz.quizType === 'true_false' || quiz.quizType === 'true-false';
            let options = originalQuestion.options || [];
            if (options.length === 0 && isTF) {
              options = [
                { id: '0', text: 'True' },
                { id: '1', text: 'False' }
              ];
            } else if (isTF) {
              options = options.slice(0, 2);
            }

            return (
              <Card
                key={idx}
                className="!p-5 space-y-4 text-left"
              >
                <div
                  className="flex justify-between items-center text-xs text-primary-fixed-dim font-bold select-none cursor-pointer"
                  onClick={() => toggleExpand(idx)}
                >
                  <span className="flex items-center gap-2">
                    <span>Question {idx + 1}</span>
                    <Badge variant={item.isCorrect ? 'success' : 'danger'}>
                      {item.isCorrect ? 'Correct' : 'Incorrect'}
                    </Badge>
                  </span>
                  <span className="material-symbols-outlined text-primary">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-on-primary-fixed-variant leading-relaxed">{item.question}</h4>

                {isExpanded && (
                  <>
                    <div className="space-y-2 mt-2">
                      {options.map((opt, oIdx) => {
                        const optId = opt.id !== undefined ? String(opt.id) : String(oIdx);
                        const isCorrectOption = item.correctAnswer === optId;
                        const isUserOption = item.userAnswer === optId;
                        const optionText = typeof opt === 'string' ? opt : opt.text || '';

                        let style = 'border-primary-fixed-dim bg-white/40 text-on-primary-fixed-variant';
                        if (isCorrectOption) {
                          style = 'border-emerald-500 bg-emerald-100 text-emerald-950 font-bold';
                        } else if (isUserOption && !item.isCorrect) {
                          style = 'border-red-500 bg-red-100 text-red-950 font-bold';
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-between ${style}`}
                          >
                            <span>{optionText}</span>
                            {isCorrectOption && (
                              <span className="material-symbols-outlined text-emerald-500 text-[18px] font-fill-1">
                                check_circle
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {item.explanation && (
                      <div className="p-3.5 rounded-lg bg-primary-fixed/40 border-l-2 border-primary flex gap-2 mt-3 text-xs font-semibold">
                        <div className="text-on-primary-fixed-variant leading-relaxed">
                          <span className="font-bold text-primary">✦ AI Explanation: </span>
                          {item.explanation}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};

export default QuizResults;
