import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import * as notesApi from '../../api/notesApi';
import * as quizzesApi from '../../api/quizzesApi';
import { handleApiError } from '../../utils/handleApiError';
import { DIFFICULTY } from '../../constants/enums';
import { ROUTES } from '../../constants/routes';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/layout/PageHeader';

const QuizGenerate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { noteId, noteTitle, topic } = location.state || {};

  // Form State
  const [selectedNoteId, setSelectedNoteId] = useState(noteId || '');
  const [selectedNoteTitle, setSelectedNoteTitle] = useState(noteTitle || '');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState(DIFFICULTY.MEDIUM);
  const [topics, setTopics] = useState(topic ? [topic] : []);
  const [quizType, setQuizType] = useState('multiple_choice');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Notes fetch state (when no noteId pre-selected)
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState(null);

  // Topic text box input state
  const [topicInput, setTopicInput] = useState('');

  // Animated dots progress state
  const [dotsCount, setDotsCount] = useState(0);

  // Note Selector Validation Error
  const [noteSelectError, setNoteSelectError] = useState(null);

  // cycling generation feedback messages
  const GENERATION_MESSAGES = [
    'Reading your notes...',
    'Analyzing key concepts...',
    'Crafting your questions...',
    'Checking question quality...',
    'Almost ready...',
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  // Fetch all notes on mount
  useEffect(() => {
    setLoadingNotes(true);
    setNotesError(null);
    notesApi
      .getNotes()
      .then((data) => {
        setNotes(data || []);
      })
      .catch(() => {
        setNotesError('Failed to load notes');
      })
      .finally(() => {
        setLoadingNotes(false);
      });
  }, []);

  // Sync selectedNoteTitle if selectedNoteId changes and we have notes list
  useEffect(() => {
    if (selectedNoteId && notes.length > 0) {
      const match = notes.find((n) => String(n.id) === String(selectedNoteId));
      if (match) {
        setSelectedNoteTitle(match.title);
      }
    }
  }, [selectedNoteId, notes]);

  // Dot progress animation timer
  useEffect(() => {
    let intervalId;
    if (generating) {
      intervalId = setInterval(() => {
        setDotsCount((prev) => (prev + 1) % 11);
      }, 400);
    } else {
      setDotsCount(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [generating]);

  // Generation Messages Timer
  useEffect(() => {
    if (!generating) {
      setMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setMsgIndex((prev) =>
        prev < GENERATION_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 2500);
    return () => clearInterval(interval);
  }, [generating]);

  const handleGenerate = async () => {
    if (!selectedNoteId) {
      setNoteSelectError('Please select a note to generate your quiz from.');
      return;
    }
    setNoteSelectError(null);
    setGenerating(true);
    setError(null);
    try {
      const quiz = await quizzesApi.generateQuiz({
        noteId: selectedNoteId,
        count,
        difficulty,
        topics,
        quizType: quizType,
      });
      navigate(ROUTES.QUIZ_TAKING.replace(':id', quiz.id), {
        state: { quiz }
      });
    } catch (err) {
      setError(handleApiError(err).message);
      setGenerating(false);
    }
  };

  // Add tag chips helpers
  const handleTopicKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTopic(topicInput);
    }
  };

  const addTopic = (value) => {
    const trimmed = value.trim();
    if (!trimmed || topics.includes(trimmed)) {
      setTopicInput('');
      return;
    }
    if (topics.length >= 5) return;
    setTopics((prev) => [...prev, trimmed]);
    setTopicInput('');
  };

  const removeTopic = (topicToRemove) => {
    setTopics((prev) => prev.filter((t) => t !== topicToRemove));
  };

  const hasSelectedNoteInList = notes.some((n) => String(n.id) === String(selectedNoteId));

  return (
    <div className="flex flex-col font-sans antialiased text-on-surface">
      <PageHeader
        icon={ClipboardList}
        title="Generate Quiz"
        subtitle="Create a custom assessment from your notes"
        action={
          <Link
            className="text-primary hover:text-primary-dark text-xs flex items-center gap-1 font-semibold transition-colors"
            to={ROUTES.QUIZZES}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Quizzes
          </Link>
        }
      />

      <div className="flex items-start justify-center mt-4">
        <div className="relative w-full max-w-4xl premium-card !p-0 overflow-hidden text-left flex flex-col hover:translate-y-0 hover:border-[#A6C5D7] transition-all duration-300">
          {/* ERROR STATE VIEW */}
          {error && !generating && (
            <div className="px-6 pt-4">
              <ErrorBanner message={error} />
            </div>
          )}

          {/* GENERATING STATE */}
          {generating ? (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[300px]">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary-fixed-dim/30 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[24px] animate-pulse">
                    psychology
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#000926]">Generating Quiz</h3>
                <p className="text-xs text-[#5B6775] font-semibold">
                  {GENERATION_MESSAGES[msgIndex]}
                </p>
              </div>
              {/* Progress dots animation */}
              <div className="flex gap-2 justify-center text-[20px] select-none text-primary/80 tracking-widest font-mono">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className={`transition-all duration-300 ${i < dotsCount ? 'opacity-100 scale-125' : 'opacity-25 scale-100'}`}>
                    ●
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* FORM CONTENT */
            <>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Left Column: Source Material & Topics */}
                  <div className="space-y-6">
                    {/* Note Selector Dropdown */}
                    <div className="space-y-2.5">
                      <div className="pm-section-label">
                        <label className="text-xs font-bold text-primary uppercase tracking-wider">Select Source Note</label>
                      </div>
                      {loadingNotes ? (
                        <div className="relative">
                          <select disabled className="w-full h-10 pl-10 pr-3 bg-primary-fixed/10 border border-primary-fixed-dim/60 rounded-lg text-sm outline-none appearance-none cursor-not-allowed">
                            <option>Loading your notes...</option>
                          </select>
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary animate-spin text-[18px]">autorenew</span>
                        </div>
                      ) : notesError ? (
                        <div className="text-red-500 text-xs font-bold p-3 bg-red-50 border border-red-200 rounded-lg">{notesError}</div>
                      ) : notes.length === 0 ? (
                        <div className="p-4 bg-primary-fixed/10 border border-primary-fixed-dim rounded-lg text-xs font-semibold text-on-primary-fixed-variant flex justify-between items-center">
                          <span>Please upload a note first</span>
                          <Link to={ROUTES.NOTES} className="text-primary font-bold hover:underline flex items-center gap-1">
                            Go to My Notes
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </Link>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={selectedNoteId}
                            onChange={(e) => {
                              setSelectedNoteId(e.target.value);
                              setNoteSelectError(null);
                            }}
                            className="w-full h-10 pl-10 pr-10 bg-white border border-[#A6C5D7] rounded-lg text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none transition-all duration-200 text-[#000926]"
                          >
                            <option value="">Select a note...</option>
                            {selectedNoteId && selectedNoteTitle && !hasSelectedNoteInList && (
                              <option value={selectedNoteId}>
                                {selectedNoteTitle}
                              </option>
                            )}
                            {notes.map((n) => (
                              <option key={n.id} value={n.id}>
                                {n.title}
                              </option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6775] text-[18px]">description</span>
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6775] pointer-events-none text-[18px]">expand_more</span>
                        </div>
                      )}
                      {noteSelectError && (
                        <p className="text-red-500 text-xs font-bold mt-1.5">{noteSelectError}</p>
                      )}
                    </div>

                    {/* Topics Tag Input */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="pm-section-label">
                          <label className="text-xs font-bold text-primary uppercase tracking-wider">Topics (optional)</label>
                        </div>
                        <span className="text-[10px] text-[#5B6775] font-bold">
                          (Max 5 · Enter to add)
                        </span>
                      </div>

                      <div className="w-full min-h-[44px] p-2 bg-white border border-[#A6C5D7] rounded-lg flex flex-wrap gap-2 items-center focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
                        {topics.map((t, i) => (
                          <span
                            key={i}
                            className="bg-primary/10 text-primary border border-primary-fixed-dim/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 select-none"
                          >
                            {t}
                            <span
                              onClick={() => removeTopic(t)}
                              className="material-symbols-outlined text-[13px] cursor-pointer hover:text-red-500 transition-colors"
                            >
                              close
                            </span>
                          </span>
                        ))}

                        {topics.length < 5 && (
                          <input
                            type="text"
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            onKeyDown={handleTopicKeyDown}
                            placeholder={topics.length === 0 ? "e.g. key concepts, main terms..." : "Add topic..."}
                            className="h-[28px] bg-transparent border-none px-2 text-xs font-semibold outline-none flex-grow min-w-[120px] focus:ring-0 text-[#000926] placeholder:text-[#5B6775]/50"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Quiz Settings */}
                  <div className="space-y-6">
                    {/* Number of questions */}
                    <div className="space-y-2.5">
                      <div className="pm-section-label">
                        <label className="text-xs font-bold text-primary uppercase tracking-wider">Number of questions</label>
                      </div>
                      <div className="flex gap-3">
                        {[5, 10, 15].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setCount(num)}
                            className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
                              count === num
                                ? 'bg-primary text-white shadow-md shadow-primary/20 hover:-translate-y-0.5'
                                : 'border border-[#A6C5D7] bg-white/40 text-on-primary-fixed-variant hover:bg-primary-fixed/20 hover:-translate-y-0.5'
                            }`}
                          >
                            {num} Questions
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-2.5">
                      <div className="pm-section-label">
                        <label className="text-xs font-bold text-primary uppercase tracking-wider">Difficulty</label>
                      </div>
                      <div className="w-full h-9 bg-primary-fixed/20 rounded-lg border border-primary-fixed-dim/60 p-0.5 flex select-none">
                        {[DIFFICULTY.EASY, DIFFICULTY.MEDIUM, DIFFICULTY.HARD].map((diff) => (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => setDifficulty(diff)}
                            className={`flex-1 rounded-md text-xs font-bold transition-all duration-200 ${
                              difficulty === diff
                                ? 'text-white bg-primary shadow-sm'
                                : 'text-[#5B6775] hover:bg-primary-fixed/30 hover:text-[#000926]'
                            }`}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quiz Type */}
                    <div className="space-y-2.5">
                      <div className="pm-section-label">
                        <label className="text-xs font-bold text-primary uppercase tracking-wider">Quiz type</label>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { label: 'Multiple Choice', value: 'multiple_choice', icon: 'list_alt' },
                          { label: 'True / False', value: 'true_false', icon: 'toggle_on' },
                          { label: 'Mixed', value: 'mixed', icon: 'shuffle' }
                        ].map((type) => {
                          const isSelected = quizType === type.value;
                          return (
                            <div
                              key={type.value}
                              onClick={() => setQuizType(type.value)}
                              className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer select-none transition-all duration-200 text-center ${
                                isSelected
                                  ? 'border-primary bg-primary/5 text-primary shadow-sm font-bold'
                                  : 'border-[#A6C5D7]/50 bg-white/40 text-on-primary-fixed-variant hover:bg-primary-fixed/20 hover:border-primary-fixed-dim/60 font-semibold'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[20px] mb-1.5">{type.icon}</span>
                              <span className="text-[11px] leading-tight">{type.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-primary-fixed/10 border-t border-primary-fixed-dim/60 flex items-center justify-between">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/app/quizzes')}
                  className="px-5"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  className="px-6 flex items-center gap-2 shadow-md shadow-primary/10"
                >
                  Generate Quiz
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizGenerate;
