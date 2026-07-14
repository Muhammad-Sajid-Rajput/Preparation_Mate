import React, { useState } from 'react';
import * as notesApi from '../../api/notesApi';
import { handleApiError } from '../../utils/handleApiError';
import { validateFile } from '../../utils/validators';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [uploadState, setUploadState] = useState('idle');
  // idle | uploading | processing | success | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Drag state
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile) => {
    const err = validateFile(selectedFile, 'notes');
    if (err) {
      setError(err);
      return;
    }
    setFile(selectedFile);
    setError(null);
    // Auto-populate title from filename without extension
    const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
    setTitle(nameWithoutExt);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setTitle('');
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    if (subject) {
      formData.append('subject', subject);
    }

    setUploadState('uploading');
    setError(null);

    try {
      await notesApi.uploadNote(formData, (pct) => {
        setProgress(pct);
        if (pct === 100) {
          setUploadState('processing');
        }
      });
      setUploadState('success');
      setTimeout(() => {
        onUploadSuccess();
        onClose();
        resetModal();
      }, 1500);
    } catch (err) {
      setUploadState('error');
      setError(handleApiError(err).message);
    }
  };

  const resetModal = () => {
    setFile(null);
    setTitle('');
    setSubject('');
    setProgress(0);
    setUploadState('idle');
    setError(null);
  };

  const handleModalClose = () => {
    if (uploadState === 'uploading' || uploadState === 'processing') return;
    onClose();
    resetModal();
  };

  // Format file size helper
  const formatSize = (bytes) => {
    if (!bytes) return '0.0 MB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm font-sans transition-all duration-300"
      onClick={handleModalClose}
    >
      <div
        className="w-full max-w-[600px] bg-primary-fixed/95 backdrop-blur-md border border-primary-fixed-dim rounded-xl p-8 flex flex-col relative shadow-[0_20px_50px_rgba(91,106,248,0.15)] transition-all animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-primary-fixed-dim/60 select-none">
          <h2 className="text-[16px] font-bold text-primary uppercase tracking-wider">Upload Notes</h2>
          {(uploadState !== 'uploading' && uploadState !== 'processing') && (
            <button
              onClick={handleModalClose}
              className="text-primary-fixed-dim hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary-fixed-dim/30"
            >
              <span className="material-symbols-outlined !text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* ERROR STATE INLINE VIEW */}
        {error && uploadState !== 'idle' && uploadState !== 'error' && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        {/* IDLE STATE */}
        {uploadState === 'idle' && (
          <div className="space-y-4">
            {/* DROP ZONE */}
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
                className={`w-full h-[200px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group ${
                  dragOver
                    ? 'border-primary bg-primary-fixed/40'
                    : 'border-primary-fixed-dim/60 bg-primary-fixed/20 hover:border-primary/50 hover:bg-primary-fixed/40'
                }`}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <span className="material-symbols-outlined !text-[40px] text-primary-fixed-dim group-hover:text-primary transition-colors">
                  cloud_upload
                </span>
                <p className="text-sm font-semibold text-on-primary-fixed-variant">
                  Drop your PDF here or{' '}
                  <span className="text-primary font-bold underline underline-offset-4">
                    Browse files
                  </span>
                </p>
                <p className="text-xs text-primary-fixed-dim font-medium">Max 20 MB · PDF only</p>
              </div>
            ) : (
              /* FILE SELECTED STATE */
              <div className="w-full p-4 rounded-lg border border-primary-fixed-dim bg-white/70 backdrop-blur-sm flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500 !text-[24px] font-fill-1 animate-pulse">
                    description
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-on-primary-fixed-variant truncate max-w-[320px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-primary-fixed-dim font-semibold">{formatSize(file.size)}</p>
                  </div>
                  <span className="material-symbols-outlined text-[#10b981] !text-[18px] font-fill-1">
                    check_circle
                  </span>
                </div>
                <button
                  onClick={handleRemove}
                  className="text-primary text-[12px] font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-xs text-left font-bold mt-1">{error}</p>
            )}

            {/* FORM FIELDS */}
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary uppercase tracking-wider">Title (optional)</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-input_height px-3 rounded-lg border border-primary-fixed-dim bg-white/70 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold transition-all"
                  placeholder="e.g. Operating Systems Week 4"
                  type="text"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-primary uppercase tracking-wider">Subject tag</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-input_height px-3 rounded-lg border border-primary-fixed-dim bg-white/70 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold transition-all"
                  placeholder="e.g. Computer Science"
                  type="text"
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-between items-center pt-6 border-t border-primary-fixed-dim/40">
              <Button
                variant="secondary"
                onClick={handleModalClose}
                className="px-5"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!file}
                className="px-6 flex items-center gap-2 shadow-md shadow-primary/10"
              >
                Upload and analyze{' '}
                <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
              </Button>
            </div>
          </div>
        )}

        {/* UPLOADING STATE */}
        {uploadState === 'uploading' && (
          <div className="py-12 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-fixed-dim !text-[20px]">
                  description
                </span>
                <span className="text-sm font-bold text-on-primary-fixed-variant truncate max-w-[400px]">
                  {file?.name}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="w-full h-[8px] bg-[#D6E6F3] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #0F52BA, #3A7BFF)' }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-on-primary-fixed-variant text-xs font-bold">
                  Uploading...{' '}
                  <span className="font-semibold font-data-mono">{progress}%</span>
                </p>
                <button
                  onClick={resetModal}
                  className="text-primary text-xs font-bold hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROCESSING STATE */}
        {uploadState === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-bounce">
              <span className="material-symbols-outlined text-primary animate-spin !text-[24px]">
                autorenew
              </span>
            </div>
            <p className="text-sm font-bold text-on-primary-fixed-variant mb-1">
              AI is analyzing your notes...
            </p>
            <p className="text-xs text-primary-fixed-dim font-medium">This usually takes 10–30 seconds.</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {uploadState === 'success' && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#10b981]/15 flex items-center justify-center mb-4 scale-110 duration-500 transition-all">
              <span className="material-symbols-outlined text-[#10b981] !text-[28px] font-fill-1">
                check_circle
              </span>
            </div>
            <p className="text-sm font-bold text-on-primary-fixed-variant mb-1">
              Note ready. Processing complete.
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {uploadState === 'error' && (
          <div className="space-y-6 pt-4">
            <ErrorBanner message={error} />
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={() => setUploadState('idle')}
                className="px-5"
              >
                Try again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
