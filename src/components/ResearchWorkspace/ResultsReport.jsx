import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  BookmarkCheck,
  Scale,
  Info,
  ArrowRight
} from 'lucide-react';

export default function ResultsReport({
  auditResult,
  uploadedFile,
  onReturnToAudit,
  onReturnToConfig,
  addToast,
}) {
  const [copied, setCopied] = useState(false);

  const hasAudit = !!auditResult;
  const isMatch = auditResult?.within_tolerance;
  const diffPP = auditResult?.difference_percentage_points ?? '0.00';

  const handleCopySummary = () => {
    const summaryText = `--- CRISISGRID AUDIT REPORT ---
Document: ${uploadedFile?.name || 'Manual Audit Session'}
Reported Accuracy: ${(auditResult?.reported_accuracy * 100).toFixed(2)}%
Measured Accuracy: ${(auditResult?.measured_accuracy * 100).toFixed(2)}%
Discrepancy Gap: ${diffPP} percentage points
Within Tolerance (±2%): ${isMatch ? 'YES (Verified)' : 'NO (Discrepancy)'}
Status: ${auditResult?.status || 'N/A'}
Backend Message: ${auditResult?.message || ''}
Disclaimer: Matching accuracy alone does not prove full reproducibility.
Generated via CrisisGrid Research Reproducibility Engine.
---------------------------------`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    addToast({
      type: 'success',
      title: 'Report Copied',
      message: 'Audit summary copied to clipboard in markdown format.',
    });
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-line">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface-paleBlue text-deepBlue border border-border-line uppercase">
              Scientific Finding Summary
            </span>
          </div>
          <h3 className="text-2xl font-display font-semibold text-ink-primary mt-1 flex items-center gap-2">
            <FileText className="w-6 h-6 text-steel" />
            <span>Audit Findings & Reproducibility Report</span>
          </h3>
          <p className="text-xs text-ink-secondary mt-1">
            Consolidated comparison of published claims, observed benchmark data, and methodological gaps.
          </p>
        </div>

        {hasAudit && (
          <button
            onClick={handleCopySummary}
            className="px-4 py-2 rounded-full text-xs font-mono font-semibold bg-white border border-border-line text-ink-primary hover:bg-canvas transition-colors flex items-center gap-2 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-status-teal" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Report Summary'}</span>
          </button>
        )}
      </div>

      {!hasAudit ? (
        /* Empty State */
        <div className="p-12 rounded-3xl bg-white text-center max-w-xl mx-auto border border-border-line shadow-card-subtle">
          <div className="w-16 h-16 rounded-2xl bg-surface-paleBlue border border-border-line flex items-center justify-center text-deepBlue mx-auto mb-4 shadow-sm">
            <Scale className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-semibold text-ink-primary mb-2">
            No Active Audit Session Recorded
          </h4>
          <p className="text-xs text-ink-secondary mb-6 leading-relaxed">
            Execute a metric comparison in the Metric Audit stage to generate an authoritative discrepancy breakdown and reproducibility findings report.
          </p>
          <button
            onClick={onReturnToAudit}
            className="px-6 py-3 rounded-full text-xs font-semibold bg-deepBlue hover:bg-ink-primary text-white shadow-cta-glow transition-all inline-flex items-center gap-2"
          >
            <span>Launch Metric Audit (/audit)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Full Findings Report */
        <div className="space-y-6">
          
          {/* Top Verdict Card */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden shadow-card-subtle ${
              isMatch
                ? 'bg-white border-status-teal/40'
                : 'bg-white border-status-red/40'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      isMatch ? 'bg-status-tealSoft text-status-teal border border-status-teal/30' : 'bg-status-redSoft text-status-red border border-status-red/30'
                    }`}
                  >
                    {auditResult.status}
                  </span>
                  <span className="text-ink-muted">FastAPI Response</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-display font-semibold text-ink-primary">
                  {isMatch
                    ? 'Numerical Alignment Achieved Within ±2% Tolerance'
                    : 'Significant Reproducibility Discrepancy Detected'}
                </h2>

                <p className="text-xs sm:text-sm text-ink-secondary mt-2 font-mono max-w-2xl leading-relaxed">
                  {auditResult.message}
                </p>
              </div>

              {/* Delta Badge */}
              <div className="p-4 rounded-2xl bg-canvas border border-border-line text-center shrink-0 min-w-[160px]">
                <div className="text-[10px] font-mono text-ink-muted uppercase font-semibold">Delta Gap</div>
                <div
                  className={`text-3xl font-mono font-bold mt-0.5 ${
                    isMatch ? 'text-status-teal' : 'text-status-red'
                  }`}
                >
                  {diffPP} <span className="text-xs font-normal text-ink-muted">pp</span>
                </div>
                <div className="text-[10px] font-mono text-ink-secondary mt-1">
                  {isMatch ? '≤ 2.0% Tolerance' : '> 2.0% Tolerance'}
                </div>
              </div>
            </div>
          </div>

          {/* Metric Comparison Side-by-Side Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Paper Claim */}
            <div className="bg-white rounded-3xl p-6 border border-border-line shadow-card-subtle">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-steel">
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Published Paper Claim</span>
                </div>
                <span className="text-xs font-mono text-ink-muted">Claimed Baseline</span>
              </div>

              <div className="text-3xl font-mono font-bold text-ink-primary mb-2">
                {(auditResult.reported_accuracy * 100).toFixed(2)}%
              </div>
              <div className="text-xs font-mono text-ink-muted">
                Raw Decimal: {auditResult.reported_accuracy}
              </div>

              <div className="mt-4 pt-4 border-t border-border-line text-xs text-ink-secondary font-sans leading-relaxed">
                Source Document: {uploadedFile ? uploadedFile.name : 'Submitted via audit inputs'}.
              </div>
            </div>

            {/* Measured Benchmark */}
            <div className="bg-white rounded-3xl p-6 border border-border-line shadow-card-subtle">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-deepBlue">
                  <Scale className="w-4 h-4 text-steel" />
                  <span>Measured Experiment Benchmark</span>
                </div>
                <span className="text-xs font-mono text-ink-muted">Observed Value</span>
              </div>

              <div className={`text-3xl font-mono font-bold mb-2 ${isMatch ? 'text-status-teal' : 'text-status-red'}`}>
                {(auditResult.measured_accuracy * 100).toFixed(2)}%
              </div>
              <div className="text-xs font-mono text-ink-muted">
                Raw Decimal: {auditResult.measured_accuracy}
              </div>

              <div className="mt-4 pt-4 border-t border-border-line text-xs text-ink-secondary font-sans leading-relaxed">
                Source: Metric Audit evaluation test bench.
              </div>
            </div>

          </div>

          {/* Limitations & Guardrails Card */}
          <div className="p-6 rounded-3xl bg-surface-paleBlue border border-border-line space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-deepBlue">
              <Info className="w-4 h-4 text-steel" />
              <span>Scientific Audit Limitations & Context</span>
            </div>

            <ul className="space-y-2 text-xs text-ink-secondary list-disc list-inside">
              <li>
                <strong>Tolerance Scope:</strong> The 2.0 percentage point tolerance threshold evaluates numerical divergence on a specific evaluation checkpoint.
              </li>
              <li>
                <strong>Hyperparameter Sensitivity:</strong> Undisclosed random seeds or subtle batch normalization configurations can explain up to 3-5% variance across repeated trials.
              </li>
              <li>
                <strong>Execution Context:</strong> This report represents metric verification against the submitted test vectors. When Member 2's runner is online, live MLflow artifacts will attach directly to this findings page.
              </li>
            </ul>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border-line">
            <div className="flex items-center gap-3">
              <button
                onClick={onReturnToAudit}
                className="px-4 py-2.5 rounded-full text-xs font-semibold bg-white text-ink-primary hover:bg-canvas border border-border-line transition-colors flex items-center gap-2 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Adjust Metric Inputs</span>
              </button>

              <button
                onClick={onReturnToConfig}
                className="px-4 py-2.5 rounded-full text-xs font-semibold bg-white text-ink-primary hover:bg-canvas border border-border-line transition-colors flex items-center gap-2 shadow-xs"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Inspect Experiment DAG</span>
              </button>
            </div>

            <button
              onClick={handleCopySummary}
              className="px-6 py-2.5 rounded-full text-xs font-semibold bg-deepBlue hover:bg-ink-primary text-white shadow-cta-glow transition-all flex items-center gap-2"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Summary Copied' : 'Export Findings Summary'}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
