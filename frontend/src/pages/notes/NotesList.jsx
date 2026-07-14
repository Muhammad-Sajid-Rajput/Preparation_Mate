import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText } from 'lucide-react';
import * as notesApi from '../../api/notesApi';
import { handleApiError } from '../../utils/handleApiError';
import { formatRelativeTime } from '../../utils/formatDate';
import { useDebounce } from '../../hooks/useDebounce';
import { ROUTES } from '../../constants/routes';
import UploadModal from './UploadModal';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBanner from '../../components/ui/ErrorBanner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { NoteCardSkeleton } from '../../components/ui/Skeleton';
import PageHeader from '../../components/layout/PageHeader';

const NotesList = () => {
  const navigate = useNavigate();
  const { notes: sharedNotes, setNotes, fetchNotes, notesLoading } = useOutletContext();
  const notes = sharedNotes || [];
  const loading = sharedNotes === null || notesLoading;
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All notes');
  const [sortBy, setSortBy] = useState('Latest');
  const [showUpload, setShowUpload] = useState(false);

  // Deletion state
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const handleDeleteClick = (note) => {
    setNoteToDelete(note);
    setShowConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;
    const backupNote = noteToDelete;
    setDeletingId(backupNote.id);
    setShowConfirm(false);

    // Optimistic UI update: remove immediately
    setNotes((prev) => prev.filter((n) => n.id !== backupNote.id));

    try {
      await notesApi.deleteNote(backupNote.id);
      toast.success('Note deleted');
    } catch (err) {
      // Rollback on failure
      setNotes((prev) => [...prev, backupNote]);
      toast.error('Could not delete note. Please try again.');
    } finally {
      setDeletingId(null);
      setNoteToDelete(null);
    }
  };

  // Helper to format file size
  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (typeof bytes === 'string') return bytes;
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Client-side filtering and sorting
  let filteredNotes = notes.filter((note) =>
    (note.title || '').toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (filterType === 'PDFs') {
    filteredNotes = filteredNotes.filter(
      (note) => (note.fileType || '').toLowerCase() === 'pdf'
    );
  } else if (filterType === 'Text') {
    filteredNotes = filteredNotes.filter(
      (note) => (note.fileType || '').toLowerCase() !== 'pdf'
    );
  }

  if (sortBy === 'Latest') {
    filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'Oldest') {
    filteredNotes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortBy === 'Name A-Z') {
    filteredNotes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else if (sortBy === 'Size') {
    filteredNotes.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
  }

  // State rendering
  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-[14px] gap-y-[14px] mt-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <NoteCardSkeleton key={idx} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-4">
          <ErrorBanner message={error.message} onRetry={fetchNotes} />
        </div>
      );
    }

    if (notes.length === 0) {
      return (
        <div className="mt-4">
          <EmptyState
            icon={FileText}
            heading="No notes yet"
            description="Upload a PDF to get started. AI will summarize it and build quizzes."
            actionLabel="Upload your first note"
            onAction={() => setShowUpload(true)}
          />
        </div>
      );
    }

    if (filteredNotes.length === 0 && search) {
      return (
        <div className="p-8 text-center text-on-surface-variant font-medium">
          No notes match your search.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[14px] mt-2 pt-2 overflow-y-auto max-h-[calc(100vh-280px)] pb-4 pr-2">
        {filteredNotes.map((note) => {
          const isPdf = (note.fileType || '').toLowerCase() === 'pdf';
          const topicsCount = note.summary?.takeaways?.length || 0;

          return (
            <div
              key={note.id}
              className={`premium-card overflow-hidden !p-0 group flex flex-col justify-between h-[156px] ${deletingId === note.id ? 'opacity-50 pointer-events-none' : ''
                }`}
            >
              {/* Card Body */}
              <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={() => navigate(`/app/notes/${note.id}`)}>
                {/* Icon wrapper */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isPdf ? 'bg-[#F40F02]/10 text-[#F40F02]' : 'bg-primary/10 text-primary'
                }`}>
                  <span className="material-symbols-outlined font-fill-1 text-[20px]">
                    {isPdf ? 'picture_as_pdf' : 'description'}
                  </span>
                </div>

                {/* Text info */}
                <div className="flex-1 min-w-0 flex flex-col text-left">
                  <span className="text-[#000926] font-bold text-[14px] truncate leading-tight group-hover:text-primary transition-colors">
                    {note.title}
                  </span>
                  <span className="text-[#5B6775] text-[11px] font-medium mt-1">
                    Uploaded {formatRelativeTime(note.createdAt)}
                  </span>
                  <span className="text-[#5B6775] text-[11px] font-medium mt-0.5">
                    {note.pageCount ? `${note.pageCount} pages` : 'Text Document'}
                    {note.fileSize ? ` · ${formatSize(note.fileSize)}` : ''}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(note);
                  }}
                  className="text-on-primary-fixed-variant/40 hover:text-error transition-all duration-200 p-1 rounded-md shrink-0 -mt-1 -mr-1 hover:bg-red-50"
                >
                  <span className="material-symbols-outlined !text-[18px]">delete</span>
                </button>
              </div>

              {/* Card Bottom */}
              <div className="p-4 pt-0 flex items-center gap-2">
                <button
                  onClick={() => navigate(`/app/notes/${note.id}`)}
                  className="flex-grow flex-1 h-[30px] bg-white/60 border border-primary-fixed-dim/60 text-on-primary-fixed-variant rounded-lg text-[12px] font-bold hover:bg-white hover:border-primary-fixed-dim transition-all duration-200 shadow-sm"
                >
                  View
                </button>
                <button
                  onClick={() =>
                    navigate(ROUTES.QUIZ_GENERATE, {
                      state: { noteId: note.id, noteTitle: note.title }
                    })
                  }
                  className="flex-grow flex-1 h-[30px] bg-primary text-white rounded-lg text-[12px] font-bold hover:bg-[#0d47a1] hover:shadow-md hover:shadow-primary/20 active:scale-[0.98] duration-200 transition-all shadow-sm"
                >
                  Generate Quiz
                </button>
              </div>
            </div>
          );
        })}

        {/* Add more notes ghost card */}
        <div
          onClick={() => setShowUpload(true)}
          className="border-[1.5px] border-dashed border-[#A6C5D7] rounded-xl flex flex-col items-center justify-center p-6 text-center group cursor-pointer bg-transparent opacity-60 hover:opacity-100 hover:border-primary hover:bg-primary-fixed/20 hover:-translate-y-1.5 transition-all duration-200 h-[156px] select-none"
        >
          <div className="w-9 h-9 rounded-full bg-[#D6E6F3] flex items-center justify-center text-primary mb-2 group-hover:bg-primary group-hover:text-white transition-all duration-200">
            <span className="material-symbols-outlined !text-[20px]">add</span>
          </div>
          <p className="text-[12px] font-bold text-[#5B6775] group-hover:text-primary transition-colors">
            Add more notes
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        icon={FileText}
        title="My Notes"
        subtitle="Manage and review your study materials"
      />

      {/* Toolbar */}
      {!loading && !error && notes.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full animate-fade-up">
          <div className="relative w-full sm:w-[300px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-primary-fixed-variant/60">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[36px] pl-10 pr-4 bg-white/70 border border-primary-fixed-dim rounded-lg text-body focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-white transition-all duration-200"
              placeholder="Search notes..."
              type="text"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {renderContent()}

      {/* Modals */}
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadSuccess={fetchNotes}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete this note?"
        body="This will also delete all quizzes from this note. This action cannot be undone."
        confirmLabel="Delete note"
        danger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowConfirm(false);
          setNoteToDelete(null);
        }}
      />
    </div>
  );
};

export default NotesList;
