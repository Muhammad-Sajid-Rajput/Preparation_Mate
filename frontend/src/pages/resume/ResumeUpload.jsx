import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck } from 'lucide-react';
import * as careerApi from '../../api/careerApi';
import { handleApiError } from '../../utils/handleApiError';
import { validateFile } from '../../utils/validators';
import { ROUTES } from '../../constants/routes';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/layout/PageHeader';

const ResumeUpload = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('Frontend Developer');
  const [jobDescription, setJobDescription] = useState('');
  const [showJD, setShowJD] = useState(false);
  
  const [uploadState, setUploadState] = useState('idle');
  // idle | uploading | processing | success | error
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  const [error, setError] = useState(null);

  const PROCESSING_STEPS = [
    'Reading document structure',
    'Extracting text content',
    'Matching keywords to role',
    'Computing ATS score',
  ];

  // Auto-advance processing steps every 2 seconds during processing state
  useEffect(() => {
    if (uploadState !== 'processing') return;
    const interval = setInterval(() => {
      setProcessingStep((prev) =>
        prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [uploadState]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const err = validateFile(selectedFile, 'resume');
    if (err) {
      setError(err);
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload your resume');
      return;
    }
    if (!targetRole.trim()) {
      setError('Please enter a target role');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', targetRole);
    if (jobDescription.trim()) {
      formData.append('jobDescription', jobDescription);
    }

    setUploadState('uploading');
    setError(null);

    try {
      const result = await careerApi.analyzeResume(formData, (pct) => {
        setProgress(pct);
        if (pct === 100) {
          setUploadState('processing');
          setProcessingStep(0);
        }
      });
      setUploadState('success');
      setTimeout(() => {
        navigate(ROUTES.RESUME_RESULTS.replace(':id', result.id), {
          state: { analysis: result }
        });
      }, 1000);
    } catch (err) {
      setUploadState('error');
      setError(handleApiError(err).message);
    }
  };

  return (
    <div className="w-full max-w-[580px] mx-auto py-12 px-4 text-left select-none -mt-4 font-sans animate-fade-up">
      {/* Page Header */}
      <PageHeader
        icon={FileCheck}
        title="Resume Review"
        subtitle="ATS score and improvement suggestions"
      />

      {error && uploadState !== 'uploading' && uploadState !== 'processing' && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      {/* Upload Card */}
      <Card className="!p-[28px] mt-[20px] shadow-sm">
        {uploadState === 'idle' || uploadState === 'error' ? (
          <form onSubmit={handleAnalyze} className="space-y-6">
            {/* Section 1: Upload */}
            <section className="space-y-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                Upload your resume
              </label>
              {!file ? (
                <div
                  onClick={() => document.getElementById('resume-file-input').click()}
                  className="w-full h-[160px] border-2 border-dashed rounded-lg bg-primary-fixed/20 border-primary-fixed-dim/60 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary-fixed/40 hover:border-primary/50 transition-all"
                >
                  <input
                    id="resume-file-input"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <span className="material-symbols-outlined text-[36px] text-primary-fixed-dim">
                    cloud_upload
                  </span>
                  <div className="text-xs font-bold text-on-primary-fixed-variant">
                    <span>Drop your PDF resume here or <span className="text-primary font-bold underline">Browse</span></span>
                  </div>
                  <p className="text-[10px] text-primary-fixed-dim font-semibold">Max 5 MB · PDF only</p>
                </div>
              ) : (
                <div className="w-full p-4 rounded-lg border border-primary-fixed-dim bg-white/70 backdrop-blur-sm flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500 !text-[24px] font-fill-1 animate-pulse">
                      picture_as_pdf
                    </span>
                    <div className="text-left">
                      <p className="text-xs font-bold text-on-primary-fixed-variant truncate max-w-[280px]">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-primary-fixed-dim font-semibold">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="text-primary text-xs font-bold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </section>

            {/* Section 2: Target Role */}
            <section className="space-y-2">
              <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                Target role <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full h-10 px-3 bg-white/70 border border-primary-fixed-dim rounded-lg text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g. Frontend Developer at a fintech startup"
                required
              />
              <p className="text-[10px] text-primary-fixed-dim font-semibold">
                Be specific — include seniority and industry if you know them.
              </p>
            </section>

            {/* Section 3: Job Description */}
            <section className="space-y-2">
              <button
                type="button"
                onClick={() => setShowJD(!showJD)}
                className="flex items-center text-primary font-bold text-xs hover:underline"
              >
                <span className="material-symbols-outlined text-[18px] mr-1">
                  {showJD ? 'remove' : 'add'}
                </span>
                Paste a job description (recommended)
              </button>
              {showJD && (
                <div className="pt-1 space-y-2 animate-fade-up">
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full h-[110px] border border-primary-fixed-dim bg-white/70 rounded-lg p-3 text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                    placeholder="Paste the full job posting here..."
                  ></textarea>
                  <p className="text-[10px] text-primary-fixed-dim font-semibold">
                    Using a JD improves ATS keyword matching accuracy.
                  </p>
                </div>
              )}
            </section>

            {/* CTA Button */}
            <div className="pt-4 border-t border-primary-fixed-dim/40">
              <Button
                type="submit"
                variant="primary"
                disabled={!file}
                className="w-full flex items-center justify-center gap-1.5 shadow-md shadow-primary/10 text-xs h-10"
              >
                Analyze Resume
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Button>
            </div>
          </form>
        ) : (
          /* UPLOADING & PROCESSING VIEW */
          <div className="space-y-6 py-4">
            {uploadState === 'uploading' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-on-primary-fixed-variant select-none">
                  <span>Uploading {file?.name}...</span>
                  <span className="font-semibold font-data-mono">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-[#D6E6F3] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #0F52BA, #3A7BFF)' }}
                  />
                </div>
              </div>
            )}

            {uploadState === 'processing' && (
              <div className="space-y-6 text-left select-none">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-primary-fixed-dim border-t-primary rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-on-primary-fixed-variant">
                    Analyzing your resume...
                  </span>
                </div>
                <div className="space-y-3.5 ml-1">
                  {PROCESSING_STEPS.map((stepName, idx) => {
                    const isCompleted = processingStep > idx;
                    const isActive = processingStep === idx;
                    
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 text-xs transition-colors duration-200 ${
                          isActive
                            ? 'text-primary font-bold'
                            : isCompleted
                            ? 'text-on-primary-fixed-variant/70 font-semibold'
                            : 'text-primary-fixed-dim'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[18px] ${isCompleted ? 'text-emerald-500' : isActive ? 'text-primary animate-spin' : 'text-primary-fixed-dim'}`}>
                          {isCompleted ? 'check_circle' : isActive ? 'sync' : 'radio_button_unchecked'}
                        </span>
                        <span>{stepName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {uploadState === 'success' && (
              <div className="py-6 flex flex-col items-center justify-center text-center select-none animate-fade-up">
                <span className="material-symbols-outlined text-emerald-500 text-[40px] font-fill-1 mb-2 animate-bounce">
                  check_circle
                </span>
                <p className="text-sm font-bold text-on-primary-fixed-variant">Analysis Complete!</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResumeUpload;
