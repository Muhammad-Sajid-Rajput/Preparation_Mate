import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import * as quizzesApi from '../../api/quizzesApi';
import { ROUTES } from '../../constants/routes';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

const QuizTaking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quiz } = location.state || {};
  const { refreshUser } = useAuth();

  // Redirect guard if no quiz state
  useEffect(() => {
    if (!quiz) {
      navigate('/app/quizzes', { replace: true });
    }
  }, [quiz, navigate]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);

  if (!quiz) return null;

  const questions = quiz.questions || [];
  const rawQuestion = questions[currentIndex];
  
  // Defensive normalization to support both legacy string arrays and modern option objects
  const currentQuestion = rawQuestion ? {
    ...rawQuestion,
    id: rawQuestion.id || rawQuestion._id ? String(rawQuestion.id || rawQuestion._id) : String(currentIndex),
    questionText: rawQuestion.questionText || rawQuestion.text || '',
    options: (rawQuestion.options || []).map((opt, idx) => {
      if (typeof opt === 'string') {
        return { id: String(idx), text: opt };
      }
      return {
        id: opt.id !== undefined && opt.id !== null ? String(opt.id) : String(idx),
        text: opt.text || ''
      };
    }),
    correctAnswer: rawQuestion.correctAnswer !== undefined && rawQuestion.correctAnswer !== null
      ? String(rawQuestion.correctAnswer)
      : rawQuestion.correctIndex !== undefined
      ? String(rawQuestion.correctIndex)
      : ''
  } : null;

  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const currentAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;

  const handleSelectOption = useCallback((questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }, []);

  const triggerShake = () => {
    setShakeActive(true);
    toast.error('Select an answer to continue');
    setTimeout(() => {
      setShakeActive(false);
    }, 400);
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    if (answers[currentQuestion.id] === undefined) {
      triggerShake();
      return;
    }

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion) return;
    if (answers[currentQuestion.id] === undefined) {
      triggerShake();
      return;
    }

    setSubmitting(true);
    try {
      const results = await quizzesApi.submitQuiz(quiz.id, answers);
      refreshUser().catch(() => {});
      navigate(ROUTES.QUIZ_RESULTS.replace(':id', quiz.id), {
        state: { results, quiz }
      });
    } catch (err) {
      toast.error('Could not save results. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F7FAFC] w-full py-1 px-4 flex flex-col justify-start">
      <div className="mx-auto w-full max-w-[780px] select-none text-left animate-fade-up">
        {/* QUIZ CARD */}
        <div className="bg-white border border-[#A6C5D7] rounded-[16px] overflow-hidden flex flex-col">
          
          {/* CARD HEADER ZONE */}
          <div className="bg-white px-6 py-3 border-b border-[#A6C5D7] flex items-center justify-between">
            <div className="flex flex-col justify-center text-left">
              <span className="text-[14px] font-semibold text-[#0F52BA] uppercase tracking-wider truncate max-w-[400px]" style={{ fontFamily: "'Sora', sans-serif" }}>
                {quiz.title || quiz.subject || 'Quiz'}
              </span>
              <span className="text-[12px] text-[#5B6775] mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                Question {currentIndex + 1} of {totalQuestions}
              </span>
            </div>
            <button
              onClick={() => setShowExitConfirm(true)}
              className="bg-white border border-[#A6C5D7] text-[#5B6775] rounded-[8px] px-[14px] py-[6px] text-[12px] font-medium transition-colors hover:border-[#BA1A1A] hover:text-[#BA1A1A]"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Exit Quiz
            </button>
          </div>

          {/* PROGRESS BAR */}
          <div className="w-full h-[4px] bg-[#E8F0F6] flex">
            <div
              className="h-full bg-[#0F52BA] rounded-r-[2px] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* QUESTION BODY */}
          {currentQuestion && (
            <div className="bg-white">
              
              {/* QUESTION ZONE */}
              <div className="px-5 pt-5 pb-3">
                <span className="inline-block bg-[#E8F0F6] text-[#0F52BA] border border-[#A6C5D7] rounded-[6px] px-2.5 py-[3px] text-[11px] font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {currentQuestion.topic || 'General Topic'}
                </span>
                <h2 className="mt-2.5 text-[16px] font-semibold text-[#000926] leading-[1.5]" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {currentQuestion.questionText}
                </h2>
              </div>

              {/* OPTIONS ZONE */}
              <div className={`px-5 pb-5 flex flex-col gap-2 ${shakeActive ? 'shake' : ''}`}>
                {(currentQuestion.options ?? []).map((option, idx) => {
                  const userSelected = answers[currentQuestion.id] === option.id;
                  const isCorrect = currentQuestion.correctAnswer === option.id;
                  const letter = String.fromCharCode(65 + idx);

                  let optionClass = 'bg-[#F7FAFC] border-[#A6C5D7] hover:bg-[#E8F0F6] hover:border-[#A6C5D7]';
                  let letterClass = 'bg-[#E8F0F6] text-[#5B6775]';
                  let textClass = 'text-[#000926] font-normal';

                  if (currentAnswered) {
                    if (isCorrect) {
                      optionClass = 'bg-[rgba(22,163,74,0.08)] border-[#16A34A]';
                      letterClass = 'bg-[#16A34A] text-white';
                      textClass = 'text-[#166534] font-medium';
                    } else if (userSelected) {
                      optionClass = 'bg-[rgba(186,26,26,0.06)] border-[#BA1A1A]';
                      letterClass = 'bg-[#BA1A1A] text-white';
                      textClass = 'text-[#991B1B] font-medium';
                    } else {
                      optionClass = 'bg-[#F7FAFC] border-[#A6C5D7] opacity-50 cursor-default';
                      letterClass = 'bg-[#E8F0F6] text-[#5B6775]';
                    }
                  } else if (userSelected) {
                    optionClass = 'bg-[#D6E6F3] border-[#0F52BA]';
                    letterClass = 'bg-[#0F52BA] text-white';
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                      disabled={currentAnswered || submitting}
                      className={`w-full text-left flex items-center gap-3 p-2 px-3 border-[1.5px] rounded-[10px] transition-all duration-150 select-none ${
                        currentAnswered ? 'cursor-default' : 'active:scale-[0.99] cursor-pointer'
                      } ${optionClass}`}
                    >
                      <div
                        className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0 transition-colors"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {letter}
                      </div>
                      <span className={`text-[13px] ${textClass}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>

            </div>
          )}

          {/* QUIZ FOOTER */}
          <footer className="border-t border-[#A6C5D7] px-6 py-4 flex items-center justify-between bg-white">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0 || submitting}
              className="bg-transparent border-none flex items-center gap-1.5 text-[14px] font-semibold text-[#5B6775] transition-colors hover:text-[#0F52BA] disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            {currentIndex === totalQuestions - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#0F52BA] text-white rounded-[8px] px-6 py-2.5 text-[14px] font-semibold flex items-center gap-1.5 transition-colors hover:bg-[#1565C0] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Quiz
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={submitting}
                className="bg-[#0F52BA] text-white rounded-[8px] px-6 py-2.5 text-[14px] font-semibold flex items-center gap-1.5 transition-colors hover:bg-[#1565C0] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Next
                <ArrowRight size={16} />
              </button>
            )}
          </footer>
        </div>
      </div>

      <ConfirmDialog
        open={showExitConfirm}
        title="Exit quiz?"
        body="Your progress will be lost."
        confirmLabel="Exit"
        danger={true}
        onConfirm={() => navigate('/app/quizzes')}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
};

export default QuizTaking;
