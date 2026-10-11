import React, { useState, useRef } from 'react';
import {
  FileUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Clock,
  ArrowRight,
  ShieldAlert,
  Search
} from 'lucide-react';
import { uploadPaper } from '../../services/api';

export default function PaperUpload({
  uploadedFile,
  setUploadedFile,
  extractionResponse,
  setExtractionResponse,
  onProceedToExtraction,
  addToast,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    setUploadError(null);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      const err = 'Invalid file type. Please upload a PDF research document (.pdf).';
      setUploadError(err);
      addToast({ type: 'error', title: 'Invalid File', message: err });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      const err = 'File size exceeds 50MB limit.';
      setUploadError(err);
      addToast({ type: 'error', title: 'File Too Large', message: err });
      return;
    }

    setUploadedFile(file);
    setExtractionResponse(null);
    addToast({
      type: 'info',
      title: 'PDF Attached',
      message: `Selected "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setExtractionResponse(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzePaper = async () => {
    if (!uploadedFile) {
      setUploadError('Please select or drop a PDF research paper first.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await uploadPaper(uploadedFile);
      setExtractionResponse(response);

      if (response.status === 'integration_pending') {
        addToast({
          type: 'warning',
          title: 'PDF Received by Backend',
          message: response.message || 'Extractor integration pending with Member 1.',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Extraction Received',
          message: 'Research paper successfully processed.',
        });
      }

      if (onProceedToExtraction) {
        onProceedToExtraction();
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to upload and extract paper.';
      setUploadError(errorMsg);
      addToast({
        type: 'error',
        title: 'Extraction Error',
        message: errorMsg,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upload Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-line">
        <div>
          <h3 className="text-xl font-display font-semibold text-ink-primary flex items-center gap-2">
            <FileUp className="w-5 h-5 text-steel" />
            <span>Research Paper Ingestion</span>
          </h3>
          <p className="text-xs text-ink-secondary mt-1">
            Target Endpoint: <code className="font-mono text-deepBlue bg-surface-paleBlue px-1.5 py-0.5 rounded">POST /extract</code> (Multipart PDF payload)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-ink-muted px-2.5 py-1 rounded-full bg-canvas border border-border-line">
            Accepts: PDF (&lt;50MB)
          </span>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploadedFile && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-steel bg-surface-paleBlue/40 scale-[1.01]'
            : uploadedFile
            ? 'border-border-line bg-canvas-light cursor-default'
            : 'border-border-line bg-white hover:border-steel/50 hover:bg-canvas-light'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {!uploadedFile ? (
          <div className="flex flex-col items-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-surface-paleBlue border border-border-line flex items-center justify-center text-deepBlue mb-4 shadow-sm">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-base font-semibold text-ink-primary mb-1">
              Drag & drop your research paper PDF here
            </h4>
            <p className="text-xs text-ink-secondary mb-4">
              or browse local files (arXiv, NeurIPS, ICML, CVPR, ICLR)
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-white hover:bg-canvas text-ink-primary border border-border-line shadow-xs transition-colors"
            >
              Browse Files
            </button>
          </div>
        ) : (
          /* Attached File Card */
          <div className="w-full max-w-xl text-left bg-white border border-border-line rounded-2xl p-5 shadow-sm relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-3 rounded-xl bg-surface-paleBlue border border-border-line text-deepBlue shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-mono text-steel uppercase font-semibold">
                    Document Ready for Intake
                  </div>
                  <h4 className="text-sm font-semibold text-ink-primary truncate max-w-sm sm:max-w-md mt-0.5" title={uploadedFile.name}>
                    {uploadedFile.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs font-mono text-ink-muted mt-1">
                    <span>{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>PDF MIME Document</span>
                    <span>•</span>
                    <span className="text-status-teal flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Header Verified
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="p-1.5 rounded-lg text-ink-muted hover:text-status-red hover:bg-status-redSoft transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If extraction response is present */}
            {extractionResponse && (
              <div className="mt-4 pt-4 border-t border-border-line">
                {extractionResponse.status === 'integration_pending' ? (
                  <div className="p-3.5 rounded-xl bg-status-amberSoft border border-status-amber/30 text-xs text-ink-primary">
                    <div className="flex items-center gap-2 font-mono font-semibold text-status-amber mb-1">
                      <Clock className="w-4 h-4" />
                      <span>Status: {extractionResponse.status}</span>
                    </div>
                    <p className="text-xs text-ink-secondary">
                      {extractionResponse.message}
                    </p>
                    <p className="text-[11px] text-ink-muted mt-2 font-mono">
                      FastAPI endpoint <code className="text-deepBlue">POST /extract</code> successfully acknowledged upload.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-status-tealSoft border border-status-teal/30 text-xs text-ink-primary">
                    <div className="flex items-center gap-2 font-mono font-semibold text-status-teal mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Status: {extractionResponse.status || 'Success'}</span>
                    </div>
                    <p className="text-xs text-ink-secondary">
                      {extractionResponse.message || 'Paper analysis completed.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="p-4 rounded-2xl bg-status-redSoft border border-status-red/30 flex items-start gap-3 text-xs text-ink-primary">
          <ShieldAlert className="w-5 h-5 text-status-red shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-status-red">Extraction / Upload Issue</div>
            <div className="text-ink-secondary mt-0.5">{uploadError}</div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-line">
        <div className="text-xs font-mono text-ink-muted">
          Supported inputs: Standard PDF machine learning papers
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {uploadedFile && (
            <button
              onClick={handleRemoveFile}
              className="w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-semibold text-ink-secondary hover:text-ink-primary border border-border-line hover:bg-canvas transition-colors"
            >
              Replace PDF
            </button>
          )}

          <button
            onClick={handleAnalyzePaper}
            disabled={!uploadedFile || isUploading}
            className={`w-full sm:w-auto px-6 py-3 rounded-full font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-cta-glow ${
              !uploadedFile || isUploading
                ? 'bg-canvas text-ink-muted cursor-not-allowed border border-border-line'
                : 'bg-deepBlue hover:bg-ink-primary text-white active:scale-95'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Uploading to /extract...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Analyze Paper (POST /extract)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
