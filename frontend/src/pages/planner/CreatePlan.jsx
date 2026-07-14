import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, BookOpen, Edit3, ClipboardList } from 'lucide-react';
import { createPlan, getSuggestedTopics } from '../../api/plannerApi';
import { getNotes } from '../../api/notesApi';
import { handleApiError } from '../../utils/handleApiError';
import { ROUTES } from '../../constants/routes';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/layout/PageHeader';

const CreatePlan = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(3);
  
  // Weekend hours split states
  const [differentWeekendHours, setDifferentWeekendHours] = useState(false);
  const [weekdayHours, setWeekdayHours] = useState(3);
  const [weekendHours, setWeekendHours] = useState(4);

  // Selected note IDs
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [notesList, setNotesList] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);

  // Suggested knowledge gap topics
  const [suggestedTopics, setSuggestedTopics] = useState([]);

  // Selected topics list: { topic, source, sourceId, priority, hours }
  const [topics, setTopics] = useState([]);

  // Study source selection states
  const [sourceUploadedNotes, setSourceUploadedNotes] = useState(true);
  const [sourceKnowledgeGaps, setSourceKnowledgeGaps] = useState(true);
  const [sourceManualTopics, setSourceManualTopics] = useState(true);
  const [gapsCollapsed, setGapsCollapsed] = useState(false);

  const [newTopicName, setNewTopicName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Collapsible sections
  const [notesCollapsed, setNotesCollapsed] = useState(false);
  const [manualCollapsed, setManualCollapsed] = useState(false);

  // AI loading message cycler
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your notes...');

  useEffect(() => {
    // Fetch notes list
    getNotes()
      .then(data => {
        setNotesList(data || []);
      })
      .catch(() => {})
      .finally(() => setNotesLoading(false));

    // Fetch suggested topics
    getSuggestedTopics()
      .then(data => {
        const list = data || [];
        setSuggestedTopics(list);
        
        // Auto-include weak topics from knowledge gaps on load
        const weakGaps = list.filter(t => t.isWeak);
        const newTopics = weakGaps.map(gap => ({
          topic: gap.topic,
          source: 'Knowledge Gaps',
          sourceId: null,
          priority: 'High',
          hours: 2
        }));
        setTopics(prev => {
          const existingNames = new Set(prev.map(p => p.topic.toLowerCase()));
          const uniqueNew = newTopics.filter(t => !existingNames.has(t.topic.toLowerCase()));
          return [...prev, ...uniqueNew];
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!creating) return;
    const messages = [
      "Analyzing your notes...",
      "Finding your weak areas...",
      "Building your daily schedule...",
      "Optimizing for your exam date...",
      "Almost ready..."
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 2500);
    return () => clearInterval(interval);
  }, [creating]);

  const daysRemaining = examDate
    ? (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [year, month, day] = examDate.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day);
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      })()
    : null;

  const calculateTotalAvailableHours = () => {
    if (!examDate || !daysRemaining) return 0;
    let total = 0;
    const today = new Date();
    for (let i = 0; i < daysRemaining; i++) {
      const currentDate = new Date(today.getTime() + i * 86400000);
      const day = currentDate.getDay(); // 0=Sun, 6=Sat
      const isWeekend = day === 0 || day === 6;
      if (isWeekend && differentWeekendHours) {
        total += weekendHours;
      } else if (!isWeekend && differentWeekendHours) {
        total += weekdayHours;
      } else {
        total += dailyHours;
      }
    }
    return total;
  };

  const getDaysRemainingInfo = (days) => {
    if (days === null || isNaN(days)) return null;
    if (days <= 0) {
      return {
        text: 'Exam date must be in the future',
        className: 'text-red-500 font-bold'
      };
    }
    if (days > 14) {
      return {
        text: `${days} days remaining — plenty of time`,
        className: 'text-emerald-600 font-bold'
      };
    }
    if (days >= 7) {
      return {
        text: `${days} days remaining — moderate schedule`,
        className: 'text-amber-600 font-bold'
      };
    }
    return {
      text: `${days} days remaining — tight schedule`,
      className: 'text-red-500 font-bold'
    };
  };

  const totalTopicHours = topics.reduce((sum, t) => sum + (Number(t.hours) || 1), 0);
  const totalAvailableHours = calculateTotalAvailableHours();
  const hoursDeficit = totalTopicHours - totalAvailableHours;

  const validateStep1 = () => {
    if (!examName.trim()) {
      setError('Exam name is required');
      return false;
    }
    if (!examDate) {
      setError('Exam date is required');
      return false;
    }
    if (daysRemaining <= 0) {
      setError('Exam date must be in the future');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (topics.length === 0) {
        setError('Please select or add at least one topic');
      } else {
        setStep(3);
      }
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      await createPlan({
        examName,
        examDate,
        dailyTargetHours: Number(dailyHours),
        weekdayHours: differentWeekendHours ? Number(weekdayHours) : null,
        weekendHours: differentWeekendHours ? Number(weekendHours) : null,
        topics: topics.map((t) => ({
          topic: t.topic,
          priority: t.priority.toLowerCase(),
          hours: Number(t.hours),
          source: t.source
        })),
        sourceNotes: Array.from(selectedNotes)
      });
      navigate(ROUTES.PLANNER);
    } catch (err) {
      setError(handleApiError(err).message);
      setCreating(false);
    }
  };

  const handleNoteToggle = (note) => {
    const updated = new Set(selectedNotes);
    if (updated.has(note._id)) {
      updated.delete(note._id);
      // Remove topics associated with this note
      setTopics(prev => prev.filter(t => t.sourceId !== note._id));
    } else {
      updated.add(note._id);
      // Add extracted topics
      const newTopics = (note.extractedTopics || []).map(topic => {
        // Auto-include gaps: check if topic matches a weak topic from suggestedTopics
        const isWeak = suggestedTopics.some(
          s => s.isWeak && s.topic.toLowerCase() === topic.toLowerCase()
        );
        return {
          topic,
          source: note.title,
          sourceId: note._id,
          priority: isWeak ? 'High' : 'Medium',
          hours: isWeak ? 2 : 1
        };
      });
      setTopics(prev => {
        const existingNames = new Set(prev.map(p => p.topic.toLowerCase()));
        const uniqueNew = newTopics.filter(t => !existingNames.has(t.topic.toLowerCase()));
        return [...prev, ...uniqueNew];
      });
    }
    setSelectedNotes(updated);
  };

  const handleToggleKnowledgeGaps = (checked) => {
    setSourceKnowledgeGaps(checked);
    if (checked) {
      const weakGaps = suggestedTopics.filter(t => t.isWeak);
      const newTopics = weakGaps.map(gap => ({
        topic: gap.topic,
        source: 'Knowledge Gaps',
        sourceId: null,
        priority: 'High',
        hours: 2
      }));
      setTopics(prev => {
        const existingNames = new Set(prev.map(p => p.topic.toLowerCase()));
        const uniqueNew = newTopics.filter(t => !existingNames.has(t.topic.toLowerCase()));
        return [...prev, ...uniqueNew];
      });
    } else {
      setTopics(prev => prev.filter(t => t.source !== 'Knowledge Gaps'));
    }
  };

  const handleAddManualTopic = (e) => {
    e.preventDefault();
    const trimmed = newTopicName.trim();
    if (!trimmed) return;
    if (topics.some((t) => t.topic.toLowerCase() === trimmed.toLowerCase())) {
      setError('Topic already added');
      return;
    }
    setTopics(prev => [...prev, {
      topic: trimmed,
      source: 'manual',
      sourceId: null,
      priority: 'Medium',
      hours: 2
    }]);
    setNewTopicName('');
    setError(null);
  };

  const handleRemoveTopic = (topicName) => {
    setTopics(prev => prev.filter(t => t.topic !== topicName));
  };

  const handlePriorityChange = (topicName, priority) => {
    setTopics(prev =>
      prev.map(t => (t.topic === topicName ? { ...t, priority } : t))
    );
  };

  const handleHoursChange = (topicName, hours) => {
    const parsed = Math.max(1, parseInt(hours) || 1);
    setTopics(prev =>
      prev.map(t => (t.topic === topicName ? { ...t, hours: parsed } : t))
    );
  };

  return (
    <div className="space-y-6 font-sans antialiased text-on-surface animate-fade-up">
      <PageHeader
        icon={CalendarIcon}
        title="Create Study Plan"
        subtitle="Your day-by-day revision schedule"
        action={
          <Link
            className="text-primary hover:text-primary-dark text-xs flex items-center gap-1 font-semibold transition-colors"
            to={ROUTES.PLANNER}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Planner
          </Link>
        }
      />

      <div className="max-w-[650px] mx-auto px-4 select-none">

      {/* Step Indicator */}
      <div className="mt-5 mb-7 select-none flex justify-center">
        <div className="flex items-center gap-0 w-[300px] justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-[2px] bg-primary-fixed-dim/30 z-0"></div>
          <div className="flex flex-col items-center z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step >= 1 ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'bg-primary-fixed text-primary-fixed-dim'
            }`}>
              1
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1">Exam</span>
          </div>

          <div className="flex flex-col items-center z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step >= 2 ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'bg-primary-fixed text-primary-fixed-dim'
            }`}>
              2
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1">Sources</span>
          </div>

          <div className="flex flex-col items-center z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step >= 3 ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'bg-primary-fixed text-primary-fixed-dim'
            }`}>
              3
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1">Generate</span>
          </div>
        </div>
      </div>

      {error && !creating && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {/* FORM CARD */}
      <Card className="min-h-[300px] flex flex-col justify-between !p-6 bg-white/80 border border-primary-fixed-dim/30 shadow-md rounded-xl">
        {step === 1 && (
          <div className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary uppercase tracking-wider block">What exam are you preparing for?</label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-primary-fixed-dim rounded-lg text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g. Software Engineering Final Exam"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-primary uppercase tracking-wider block">Exam date</label>
              <div className="relative">
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-primary-fixed-dim rounded-lg text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-10"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary-fixed-dim pointer-events-none text-[20px]">calendar_month</span>
              </div>
              {examDate && (() => {
                const info = getDaysRemainingInfo(daysRemaining);
                if (!info) return null;
                return (
                  <p className={`text-xs mt-1 ${info.className}`}>
                    {info.text}
                  </p>
                );
              })()}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-primary uppercase tracking-wider block">Daily study hours available</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDailyHours(h)}
                    className={`w-[44px] h-[34px] rounded-lg border font-bold text-xs transition-all duration-200 active:scale-95 ${
                      dailyHours === h
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 hover:-translate-y-0.5'
                        : 'border-primary-fixed-dim bg-primary-fixed/20 text-on-primary-fixed-variant hover:bg-primary-fixed/40 hover:-translate-y-0.5'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-primary-fixed-dim/20">
              <input
                type="checkbox"
                id="weekendSplit"
                checked={differentWeekendHours}
                onChange={(e) => setDifferentWeekendHours(e.target.checked)}
                className="w-4 h-4 rounded border-primary-fixed-dim text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="weekendSplit" className="text-xs font-bold text-primary uppercase tracking-wider cursor-pointer">
                Different hours on weekends?
              </label>
            </div>

            {differentWeekendHours && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider block">Weekday Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={weekdayHours}
                    onChange={(e) => setWeekdayHours(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-10 px-3 bg-white border border-primary-fixed-dim rounded-lg text-sm font-semibold focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider block">Weekend Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={weekendHours}
                    onChange={(e) => setWeekendHours(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-10 px-3 bg-white border border-primary-fixed-dim rounded-lg text-sm font-semibold focus:border-primary outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-left">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Select Study Sources</h3>
            <p className="text-xs text-primary-fixed-dim font-semibold">Choose where to extract your revision content from.</p>
            
            {/* Study Sources Selector Checkboxes */}
            <div className="flex flex-wrap gap-4 p-3 bg-primary-fixed/10 rounded-lg border border-primary-fixed-dim/20 animate-fade-in">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sourceUploadedNotes}
                  onChange={(e) => setSourceUploadedNotes(e.target.checked)}
                  className="w-4 h-4 rounded border-primary-fixed-dim text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Uploaded Notes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sourceKnowledgeGaps}
                  onChange={(e) => handleToggleKnowledgeGaps(e.target.checked)}
                  className="w-4 h-4 rounded border-primary-fixed-dim text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Knowledge Gaps</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sourceManualTopics}
                  onChange={(e) => setSourceManualTopics(e.target.checked)}
                  className="w-4 h-4 rounded border-primary-fixed-dim text-primary focus:ring-primary"
                />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Manual Topics</span>
              </label>
            </div>

            {/* COLLAPSIBLE SECTION A - From Notes */}
            {sourceUploadedNotes && (
              <div className="border border-primary-fixed-dim/30 rounded-lg overflow-hidden bg-white/70">
                <button
                  type="button"
                  onClick={() => setNotesCollapsed(!notesCollapsed)}
                  className="w-full px-4 py-2.5 bg-primary-fixed/20 flex justify-between items-center text-xs font-bold text-primary"
                >
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>From Uploaded Notes</span>
                  </div>
                  {notesCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
                {!notesCollapsed && (
                  <div className="p-3 space-y-2 max-h-[140px] overflow-y-auto">
                    {notesLoading ? (
                      <p className="text-[11px] text-primary-fixed-dim">Loading notes...</p>
                    ) : notesList.length === 0 ? (
                      <p className="text-[11px] text-primary-fixed-dim italic">No notes uploaded yet.</p>
                    ) : (
                      notesList.map((note) => (
                        <label key={note._id} className="flex items-start gap-2.5 cursor-pointer py-1 select-none">
                          <input
                            type="checkbox"
                            checked={selectedNotes.has(note._id)}
                            onChange={() => handleNoteToggle(note)}
                            className="w-4 h-4 rounded border-primary-fixed-dim text-primary focus:ring-primary mt-0.5"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-on-surface leading-tight">{note.title}</span>
                            <span className="text-[10px] text-primary-fixed-dim leading-none mt-0.5">
                              {note.pageCount || '?'} pages · {(note.extractedTopics || []).length} topics
                            </span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* COLLAPSIBLE SECTION B removed - Knowledge Gaps automatically included when checked above */}

            {/* COLLAPSIBLE SECTION C - Add Manual Topics */}
            {sourceManualTopics && (
              <div className="border border-primary-fixed-dim/30 rounded-lg overflow-hidden bg-white/70">
                <button
                  type="button"
                  onClick={() => setManualCollapsed(!manualCollapsed)}
                  className="w-full px-4 py-2.5 bg-primary-fixed/20 flex justify-between items-center text-xs font-bold text-primary"
                >
                  <div className="flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4" />
                    <span>Add Manual Topics</span>
                  </div>
                  {manualCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
                {!manualCollapsed && (
                  <div className="p-3">
                    <form onSubmit={handleAddManualTopic} className="flex gap-2">
                      <input
                        type="text"
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="Enter study topic..."
                        className="flex-1 h-[36px] rounded-lg border border-primary-fixed-dim bg-white px-3 text-xs font-semibold focus:border-primary outline-none"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        className="h-[36px] px-4 text-xs font-bold shadow-sm"
                      >
                        Add
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* COMBINED TOPICS LIST AT BOTTOM */}
            {topics.length > 0 && (
              <div className="pt-3 border-t border-primary-fixed-dim/20">
                <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">Combined Topics ({topics.length})</h4>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {topics.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg border border-primary-fixed-dim/20 bg-primary-fixed/10 shadow-sm"
                    >
                      <div className="flex flex-col text-left truncate flex-1 min-w-0 pr-2">
                        <span className="text-xs font-bold text-on-primary-fixed-variant truncate">{t.topic}</span>
                        <span className="text-[9px] font-bold text-primary/70 truncate">
                          Source: {t.source}
                        </span>
                      </div>
                      <div className="flex items-center shrink-0">
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(t.topic)}
                          className="text-primary-fixed-dim hover:text-red-500 transition-colors p-1"
                        >
                          <span className="material-symbols-outlined text-[16px] font-bold">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feasibility Checker warning/suggestions bar */}
            {daysRemaining !== null && daysRemaining > 0 && (
              <div className={`mt-3 p-3 rounded-lg border text-[11px] font-bold ${
                hoursDeficit <= 0 
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}>
                {hoursDeficit <= 0 ? (
                  <span>Total topics: {totalTopicHours}h across {daysRemaining} days — within your {totalAvailableHours}h available limit</span>
                ) : (
                  <div>
                    <span className="block text-red-600 mb-1">Short By: {hoursDeficit}h</span>
                    <span className="block font-medium text-amber-800">
                      Your requested study time exceeds your available capacity ({totalAvailableHours}h). To resolve this:
                    </span>
                    <ul className="list-disc list-inside mt-1 font-semibold text-amber-800 space-y-0.5">
                      <li>Increase your daily study hours in Step 1</li>
                      <li>Remove some low-priority topics</li>
                      <li>Select an exam date further in the future</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-left">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Review & Generate</h3>
            {creating ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center animate-spin">
                  <span className="material-symbols-outlined text-primary text-[20px]">autorenew</span>
                </div>
                <p className="text-xs font-bold text-on-primary-fixed-variant animate-pulse">
                  {loadingMessage}
                </p>
                <p className="text-[10px] text-primary-fixed-dim font-bold">Generating your personalized study plan...</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-primary-fixed-dim font-semibold">We will structure your tasks day-by-day until your exam date.</p>
                <div className="bg-[#D6E6F3]/30 p-4 rounded-xl border border-primary-fixed-dim/50 space-y-3">
                  <div className="flex justify-between items-center text-xs text-on-primary-fixed-variant font-semibold">
                    <span>Exam Prep Title:</span>
                    <span className="font-bold text-primary">{examName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-on-primary-fixed-variant font-semibold">
                    <span>Exam Target Date:</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200/50 rounded font-bold">
                      {examDate} ({daysRemaining} days away)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-on-primary-fixed-variant font-semibold">
                    <span>Daily Study Target:</span>
                    <span className="font-bold text-primary">
                      {differentWeekendHours 
                        ? `Weekdays: ${weekdayHours}h · Weekends: ${weekendHours}h` 
                        : `${dailyHours} hours`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-on-primary-fixed-variant font-semibold">
                    <span>Selected Topics:</span>
                    <span className="font-bold text-primary">{topics.length} topics ({totalTopicHours}h total)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-on-primary-fixed-variant font-semibold">
                    <span>Available Capacity:</span>
                    <span className="font-bold text-primary">{totalAvailableHours}h total</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-on-primary-fixed-variant font-semibold pt-2 border-t border-primary-fixed-dim/20">
                    <span>Schedule Feasibility:</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      hoursDeficit <= 0 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {hoursDeficit <= 0 ? 'Enough time' : 'Tight schedule'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* FOOTER ACTIONS */}
      {!creating && (
        <div className="mt-6 flex justify-between select-none">
          {step > 1 ? (
            <Button
              variant="secondary"
              onClick={handlePrevStep}
              className="px-5 flex items-center gap-1.5 text-xs h-10"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back
            </Button>
          ) : (
            <div></div>
          )}

          {step === 3 ? (
            <Button
              variant="primary"
              onClick={handleCreate}
              className="px-6 flex items-center gap-1.5 text-xs h-10 shadow-md shadow-primary/10 ml-auto font-bold"
            >
              Generate Plan
              <span className="material-symbols-outlined text-[16px]">done</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNextStep}
              className="px-6 flex items-center gap-1.5 text-xs h-10 shadow-md shadow-primary/10 ml-auto font-bold"
            >
              Next Step
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Button>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default CreatePlan;
