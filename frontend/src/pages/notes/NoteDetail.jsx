import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import * as notesApi from '../../api/notesApi';
import { handleApiError } from '../../utils/handleApiError';
import { formatDate } from '../../utils/formatDate';
import { ROUTES } from '../../constants/routes';
import ErrorBanner from '../../components/ui/ErrorBanner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/layout/PageHeader';

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notesApi.getNoteById(id);
      setNote(data);
    } catch (err) {
      const formatted = handleApiError(err);
      if (formatted.status === 404) {
        toast.error('Note not found');
        navigate(ROUTES.NOTES, { replace: true });
      } else {
        setError(formatted);
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setShowConfirm(false);
    try {
      await notesApi.deleteNote(id);
      toast.success('Note deleted successfully');
      navigate(ROUTES.NOTES);
    } catch (err) {
      toast.error('Could not delete note. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const truncateText = (str, n = 3) => {
    if (!str) return '';
    const words = str.split(' ');
    return words.slice(0, n).join(' ') + (words.length > n ? '...' : '');
  };

  if (loading) {
    return (
      <div className="font-sans antialiased text-on-surface space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="h-[52px] border-b border-primary-fixed-dim/60 flex items-center px-6 -mx-4 md:-mx-6 -mt-6 mb-6 bg-primary-fixed/40 animate-pulse">
          <div className="h-4 bg-primary-fixed-dim rounded w-48" />
        </div>

        <div className="flex flex-col lg:flex-row gap-5 w-full">
          {/* Left panel skeleton */}
          <div className="w-full lg:w-[55%] flex flex-col h-[500px]">
            <div className="premium-card flex flex-col flex-grow overflow-hidden gap-4">
              <div className="h-6 bg-primary-fixed/50 rounded w-1/4 animate-pulse" />
              <div className="flex-grow bg-primary-fixed/30 rounded-lg animate-pulse h-[400px]" />
            </div>
          </div>

          {/* Right panel skeleton */}
          <div className="w-full lg:w-[45%] flex flex-col gap-4">
            <div className="premium-card space-y-3">
              <div className="h-5 bg-primary-fixed/50 rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-primary-fixed/30 rounded w-full animate-pulse" />
              <div className="h-4 bg-primary-fixed/30 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-primary-fixed/30 rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-primary-fixed/30 rounded w-3/4 animate-pulse" />
            </div>

            <div className="premium-card space-y-3">
              <div className="h-5 bg-primary-fixed/50 rounded w-1/4 animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-7 w-20 bg-primary-fixed/30 rounded-full animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-sans space-y-6 pt-4">
        <ErrorBanner message={error.message} onRetry={fetchNote} />
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="font-sans antialiased text-on-surface animate-fade-up">
      <PageHeader
        icon={FileText}
        title={note.title}
        subtitle={
          <Link
            className="text-primary hover:underline text-[12px] flex items-center gap-1 font-semibold transition-colors"
            to={ROUTES.NOTES}
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to My Notes
          </Link>
        }
        action={
          <div className="flex items-center gap-2 select-none">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(ROUTES.CHAT, {
                  state: { noteId: note.id, noteTitle: note.title }
                })
              }
              className="flex items-center gap-1.5 h-[32px] px-3 text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">smart_toy</span>
              Ask AI
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                navigate(ROUTES.QUIZ_GENERATE, {
                  state: { noteId: note.id, noteTitle: note.title }
                })
              }
              className="h-[32px] px-3.5 text-xs shadow-md shadow-primary/10"
            >
              Generate Quiz
            </Button>
          </div>
        }
      />

      {/* CONTENT AREA */}
      <div className="flex flex-col lg:flex-row gap-5 w-full">
        {/* LEFT COLUMN: PDF PREVIEW (55%) */}
        <div className="w-full lg:w-[55%] flex flex-col min-h-[500px]">
          <div className="premium-card !p-0 flex flex-col flex-grow overflow-hidden">
            {/* Preview Header */}
            <div className="h-[44px] bg-primary-fixed/30 border-b border-primary-fixed-dim/60 flex items-center justify-between px-4 select-none">
              <span className="text-[11px] text-on-primary-fixed-variant uppercase font-bold tracking-wider">
                PDF Preview
              </span>
              <span className="text-xs text-on-primary-fixed-variant font-medium">
                {note.pageCount ? `Page 1 of ${note.pageCount}` : 'Preview'}
              </span>
              {note.fileUrl && (
                <a
                  className="text-primary flex items-center gap-1 hover:underline text-xs font-semibold"
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Open Original</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              )}
            </div>

            {/* PDF Viewer */}
            <div className="flex-grow bg-primary-fixed/10 min-h-[400px] flex items-center justify-center relative">
              {note.fileUrl ? (
                <iframe
                  src={note.fileUrl}
                  title="PDF Preview"
                  className="w-full h-full border-none min-h-[450px]"
                />
              ) : (
                <div className="p-8 text-center flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-primary-fixed-dim text-[48px]">
                    find_in_page
                  </span>
                  <p className="text-body font-medium text-on-primary-fixed-variant">
                    PDF preview not available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INSIGHTS (45%) */}
        <div className="w-full lg:w-[45%] flex flex-col gap-4">
          {/* AI SUMMARY CARD */}
          <Card className="text-left !p-5">
            <div className="pb-3 mb-3 border-b border-primary-fixed-dim/50 flex items-center gap-2 select-none">
              <span className="material-symbols-outlined text-primary text-[18px] font-fill-1">
                auto_awesome
              </span>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Summary</span>
            </div>
            <div className="space-y-4">
              {/* Takeaways / Summary Paragraph */}
              <div className="text-sm text-on-primary-fixed-variant leading-relaxed space-y-2 font-medium">
                {note.summary?.takeaways && note.summary.takeaways.length > 0 ? (
                  note.summary.takeaways.map((takeaway, i) => (
                    <p key={i}>{takeaway}</p>
                  ))
                ) : (
                  <p className="text-primary-fixed-dim italic text-xs">No summary takeaways available.</p>
                )}
              </div>

              {/* Highlights Bullet List */}
              {note.summary?.highlights && note.summary.highlights.length > 0 && (
                <div className="pt-3 border-t border-primary-fixed-dim/50">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
                    Key Highlights
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-on-primary-fixed-variant text-[13px] font-medium">
                    {note.summary.highlights.map((highlight, i) => (
                      <li key={i}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* EXTRACTED TOPICS / FLASHCARDS CARD */}
          {note.summary?.flashcards && note.summary.flashcards.length > 0 && (
            <Card className="text-left !p-5">
              <div className="pb-3 mb-3 border-b border-primary-fixed-dim/50 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    push_pin
                  </span>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Extracted Topics</span>
                </div>
                <Badge variant="brand">
                  {note.summary.flashcards.length} TOPICS
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {note.summary.flashcards.map((flashcard, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      navigate(ROUTES.QUIZ_GENERATE, {
                        state: { noteId: note.id, noteTitle: note.title }
                      })
                    }
                    title={flashcard.question}
                    className="px-3 py-1.5 bg-primary-fixed/40 hover:bg-primary-fixed text-on-primary-fixed-variant rounded-full text-xs border border-primary-fixed-dim/40 hover:border-primary/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 select-none font-semibold shadow-sm"
                  >
                    {truncateText(flashcard.question, 3)}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* ACTIONS CARD */}
          <Card className="text-left !p-5">
            <div className="pb-3 mb-3 border-b border-primary-fixed-dim/50 select-none">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Actions</span>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={() =>
                  navigate(ROUTES.QUIZ_GENERATE, {
                    state: { noteId: note.id, noteTitle: note.title }
                  })
                }
                className="w-full h-10 flex items-center justify-start px-4 gap-3 text-xs"
              >
                <span className="material-symbols-outlined text-[20px]">quiz</span>
                Generate Quiz
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(ROUTES.CHAT, {
                    state: { noteId: note.id, noteTitle: note.title }
                  })
                }
                className="w-full h-10 flex items-center justify-start px-4 gap-3 text-xs"
              >
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                Ask AI about this note
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(ROUTES.PLANNER_CREATE, {
                    state: { topic: note.title }
                  })
                }
                className="w-full h-10 flex items-center justify-start px-4 gap-3 text-xs"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                Add to Study Plan
              </Button>
              <button
                disabled={isDeleting}
                onClick={() => setShowConfirm(true)}
                className="w-full h-10 border border-transparent text-red-600 font-semibold rounded-lg flex items-center px-4 gap-3 text-xs hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
                Delete Note
              </button>
            </div>
          </Card>

          {/* QUICK STATS */}
          <div className="bg-primary-fixed/30 border border-primary-fixed-dim/50 border-dashed rounded-xl p-4 flex justify-between items-center select-none font-medium">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Created</span>
              <span className="text-on-primary-fixed-variant text-xs font-semibold">{formatDate(note.createdAt)}</span>
            </div>
            <div className="w-[1px] h-8 bg-primary-fixed-dim/40"></div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Pages</span>
              <span className="text-on-primary-fixed-variant text-xs font-semibold">{note.pageCount || 'N/A'}</span>
            </div>
            <div className="w-[1px] h-8 bg-primary-fixed-dim/40"></div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Format</span>
              <span className="text-on-primary-fixed-variant text-xs uppercase font-semibold">
                {note.fileType || 'PDF'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Delete this note?"
        body="This will also delete all quizzes from this note. This action cannot be undone."
        confirmLabel="Delete note"
        danger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};

export default NoteDetail;
