import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';

const FileDropZone = ({ onFileSelect, accept = '.pdf,.doc,.docx,.txt', maxSizeMb = 10 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState('idle'); // idle | selected | uploading | success | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = (file) => {
    if (!file) return;

    // Check file size
    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > maxSizeMb) {
      setErrorMsg(`File size exceeds the ${maxSizeMb}MB limit.`);
      setUploadState('error');
      return;
    }

    // Reset error
    setErrorMsg('');
    setSelectedFile(file);
    setUploadState('selected');
    
    // Simulate uploading
    setUploadState('uploading');
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadState('success');
          if (onFileSelect) {
            onFileSelect(file);
          }
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setUploadState('idle');
    setUploadProgress(0);
    setErrorMsg('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={uploadState === 'idle' ? onButtonClick : undefined}
      className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer text-center min-h-[200px] select-none
        ${dragActive ? 'border-primary bg-primary-fixed/40 scale-[1.01]' : 'border-primary-fixed-dim/60 hover:border-primary hover:bg-primary-fixed/20 bg-white/70'}
        ${uploadState === 'uploading' ? 'cursor-wait border-primary-fixed' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleChange}
      />

      {uploadState === 'idle' && (
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-primary-fixed text-primary rounded-full">
            <UploadCloud size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#000926]">
              Drag & drop file here, or <span className="text-primary hover:underline font-extrabold">browse</span>
            </p>
            <p className="text-xs text-[#5B6775]/70 mt-1 font-semibold">
              Supports {accept.replace(/\./g, '').toUpperCase()} (Max {maxSizeMb}MB)
            </p>
          </div>
        </div>
      )}

      {uploadState === 'uploading' && (
        <div className="w-full flex flex-col items-center space-y-4">
          <div className="p-3 bg-primary-fixed text-primary rounded-full animate-bounce">
            <UploadCloud size={28} />
          </div>
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-[#5B6775] font-bold mb-1">
              <span className="truncate max-w-[180px]">{selectedFile?.name}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#D6E6F3] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #0F52BA, #3A7BFF)' }} />
            </div>
          </div>
        </div>
      )}

      {uploadState === 'success' && (
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-success-light text-success rounded-full">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#000926]">
              File uploaded successfully!
            </p>
            <p className="text-xs text-[#5B6775] mt-1 truncate max-w-xs font-mono font-bold">
              {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-primary hover:underline font-bold mt-2"
          >
            Upload another file
          </button>
        </div>
      )}

      {uploadState === 'error' && (
        <div className="flex flex-col items-center space-y-3">
          <div className="p-3 bg-danger-light text-danger rounded-full">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-danger">
              Upload Failed
            </p>
            <p className="text-xs text-[#5B6775] mt-1 font-semibold">
              {errorMsg || 'Something went wrong.'}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-primary hover:underline font-bold mt-2"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
};

export default FileDropZone;
