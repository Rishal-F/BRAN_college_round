import React, { useState } from 'react';
import {
  FileSearch,
  Cpu,
  Database,
  BookmarkCheck,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Quote,
  Eye,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import { SAMPLE_PAPER_EXTRACTION } from '../../data/mockData';

export default function ExtractedInspector({
  extractionResponse,
  uploadedFile,
  onProceedToConfig,
  onProceedToAudit,
}) {
  const [showDemoPreview, setShowDemoPreview] = useState(false);
  const [expandedEvidence, setExpandedEvidence] = useState([0]);

  const hasRealExtractedFields =
    extractionResponse &&
    extractionResponse.status !== 'integration_pending' &&
    (extractionResponse.title ||
      extractionResponse.methodology ||
      extractionResponse.model_or_algorithm ||
      extractionResponse.confirmed_details);


  const data = hasRealExtractedFields
    ? extractionResponse
    : showDemoPreview
    ? SAMPLE_PAPER_EXTRACTION
    : null;

  const toggleEvidence = (idx) => {
    setExpandedEvidence((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-line">
        <div>
          <h3 className="text-xl font-display font-semibold text-ink-primary flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-steel" />
            <span>Extracted Paper Details & Evidence</span>
          </h3>
          <p className="text-xs text-ink-secondary mt-1">
            Structural extraction of claimed algorithms, hyperparameters, metrics, and source citations.
          </p>
        </div>

        {/* Demo Schema Preview Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDemoPreview(!showDemoPreview)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium border transition-all flex items-center gap-1.5 ${
              showDemoPreview
                ? 'bg-surface-paleBlue border-steel text-deepBlue font-semibold shadow-xs'
                : 'bg-white border-border-line text-ink-secondary hover:text-ink-primary hover:bg-canvas'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showDemoPreview ? 'Viewing Demo Schema' : 'Preview Extractor Layout'}</span>
          </button>
        </div>
      </div>

      {/* Backend Integration Pending Banner */}
      {(!extractionResponse || extractionResponse.status === 'integration_pending') && !hasRealExtractedFields && (
        <div className="p-6 rounded-3xl bg-status-amberSoft border border-status-amber/30 relative">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white border border-status-amber/30 text-status-amber shrink-0 shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white text-status-amber border border-status-amber/30 font-semibold uppercase">
                  INTEGRATION PENDING (MEMBER 1)
                </span>
                <span className="text-xs font-mono text-ink-muted">
                  Endpoint: POST /extract
                </span>
              </div>
              <h4 className="text-base font-semibold text-ink-primary mt-2">
                {uploadedFile ? `PDF "${uploadedFile.name}" received by FastAPI backend` : 'Awaiting Paper Upload'}
              </h4>
              <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                {extractionResponse?.message ||
                  'The PDF upload pipeline is operational. Automated parsing of model architecture, hyperparameters, and metrics is currently awaiting Member 1 (Extractor Service) connection.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowDemoPreview(true)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-deepBlue hover:bg-ink-primary text-white transition-all shadow-cta-glow flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Complete Extractor Schema</span>
                </button>
                <button
                  onClick={onProceedToAudit}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white text-ink-primary hover:bg-canvas border border-border-line transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Skip to Working Metric Audit (/audit)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Extracted Details Content */}
      {data && (
        <div className="space-y-6">
          
          {/* Demonstration Notice */}
          {data.isDemonstrationData && (
            <div className="p-3.5 rounded-2xl bg-surface-paleBlue border border-border-line flex items-center justify-between text-xs text-ink-primary">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-steel" />
                <span className="font-mono">
                  <strong>DEMO PREVIEW:</strong> Showing structured research schema for ResNet-50 Reproducibility paper.
                </span>
              </div>
              <span className="text-[11px] font-mono text-deepBlue bg-white px-2 py-0.5 rounded-full border border-border-line font-medium">
                Sample Layout
              </span>
            </div>
          )}

          {/* Paper Title & Metadata Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-border-line shadow-card-subtle">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-ink-muted mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-surface-paleBlue border border-border-line text-deepBlue font-medium">
                {data.venue || 'Research Preprint'}
              </span>
              <span>•</span>
              <span>Year: {data.year || '2024'}</span>
              <span>•</span>
              <span>DOI: {data.doi || 'arXiv.2403.99214'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-ink-primary tracking-tight leading-snug">
              {data.title}
            </h2>
            {data.authors && (
              <p className="text-xs text-ink-secondary mt-2 font-mono">
                Authors: {data.authors.join(', ')}
              </p>
            )}
          </div>

          {/* Grid: Methodology & Dataset */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Methodology Card */}
            <div className="bg-white rounded-3xl p-6 border border-border-line shadow-card-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-deepBlue mb-4">
                  <Cpu className="w-4 h-4 text-steel" />
                  <span>Model & Optimization Regimen</span>
                </div>

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between py-1.5 border-b border-border-line">
                    <span className="text-ink-muted">Architecture:</span>
                    <span className="text-ink-primary font-semibold">{data.methodology?.model_architecture}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border-line">
                    <span className="text-ink-muted">Optimizer:</span>
                    <span className="text-ink-primary">{data.methodology?.optimizer}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border-line">
                    <span className="text-ink-muted">Learning Rate:</span>
                    <span className="text-steel font-bold">{data.methodology?.learning_rate}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border-line">
                    <span className="text-ink-muted">LR Schedule:</span>
                    <span className="text-ink-primary truncate max-w-[200px]">{data.methodology?.lr_schedule}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border-line">
                    <span className="text-ink-muted">Batch Size:</span>
                    <span className="text-ink-primary">{data.methodology?.batch_size}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-ink-muted">Precision:</span>
                    <span className="text-status-teal font-semibold">{data.methodology?.precision}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dataset & Preprocessing Card */}
            <div className="bg-white rounded-3xl p-6 border border-border-line shadow-card-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-deepBlue mb-4">
                  <Database className="w-4 h-4 text-steel" />
                  <span>Dataset & Preprocessing Protocol</span>
                </div>

                <div className="space-y-2.5 text-xs font-mono mb-4">
                  <div className="flex justify-between py-1.5 border-b border-border-line">
                    <span className="text-ink-muted">Dataset:</span>
                    <span className="text-ink-primary font-semibold">{data.dataset?.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border-line">
                    <span className="text-ink-muted">Train Samples:</span>
                    <span className="text-ink-primary">{data.dataset?.train_samples?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border-line">
                    <span className="text-ink-muted">Val Samples:</span>
                    <span className="text-ink-primary">{data.dataset?.val_samples?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-ink-muted mb-1.5">Preprocessing Pipeline:</div>
                <div className="p-3 rounded-2xl bg-canvas border border-border-line space-y-1">
                  {data.dataset?.preprocessing?.map((step, idx) => (
                    <div key={idx} className="text-[11px] font-mono text-ink-secondary truncate">
                      <span className="text-steel font-semibold">{idx + 1}.</span> {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Reported Benchmark Claims */}
          <div className="bg-white rounded-3xl p-6 border border-border-line shadow-card-subtle">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-primary">
                <BookmarkCheck className="w-4 h-4 text-steel" />
                <span>Extracted Benchmark Claims (Paper Ground Truth)</span>
              </div>
              <span className="text-xs font-mono text-ink-muted">Source Cited in Paper</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.reported_metrics?.map((metric, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-canvas border border-border-line">
                  <div className="text-xs text-ink-secondary font-mono">{metric.name}</div>
                  <div className="text-2xl font-bold text-deepBlue mt-1 font-mono">
                    {metric.unit === 'ratio'
                      ? `${(metric.reported_value * 100).toFixed(1)}%`
                      : metric.reported_value}
                  </div>
                  <div className="text-[11px] font-mono text-ink-muted mt-2 flex items-center gap-1">
                    <Quote className="w-3 h-3 text-steel" />
                    <span>{metric.page}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmed Details vs Ambiguities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Confirmed Details */}
            <div className="p-6 rounded-3xl bg-white border border-status-teal/30 shadow-card-subtle">
              <div className="flex items-center gap-2 text-sm font-semibold text-status-teal mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span>Confirmed Implementation Details</span>
              </div>

              <div className="space-y-3">
                {data.confirmed_details?.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-canvas border border-border-line">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-ink-primary">{item.field}</span>
                      <span className="text-[10px] font-mono text-status-teal bg-status-tealSoft px-2 py-0.5 rounded-full border border-status-teal/30 font-medium">
                        {item.page}
                      </span>
                    </div>
                    <div className="text-xs text-ink-secondary mt-1">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing or Ambiguous Details */}
            <div className="p-6 rounded-3xl bg-white border border-status-amber/30 shadow-card-subtle">
              <div className="flex items-center gap-2 text-sm font-semibold text-status-amber mb-4">
                <AlertTriangle className="w-4 h-4" />
                <span>Missing / Ambiguous Methodological Gaps</span>
              </div>

              <div className="space-y-3">
                {data.missing_or_ambiguous_details?.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-canvas border border-border-line">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-ink-primary">{item.field}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-medium ${
                          item.severity === 'high'
                            ? 'bg-status-redSoft text-status-red border border-status-red/30'
                            : 'bg-status-amberSoft text-status-amber border border-status-amber/30'
                        }`}
                      >
                        {item.severity} Risk
                      </span>
                    </div>
                    <div className="text-xs text-ink-secondary mt-1">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Collapsible Evidence Quotes Drawer */}
          {data.evidence_snippets && data.evidence_snippets.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-border-line shadow-card-subtle">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink-primary">
                  <Quote className="w-4 h-4 text-steel" />
                  <span>Source Text Evidence Snippets</span>
                </div>
                <span className="text-xs font-mono text-ink-muted">Extracted Quotations</span>
              </div>

              <div className="space-y-2.5">
                {data.evidence_snippets.map((snip, idx) => {
                  const isExpanded = expandedEvidence.includes(idx);
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border-line bg-canvas overflow-hidden"
                    >
                      <button
                        onClick={() => toggleEvidence(idx)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-black/5 focus:outline-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-deepBlue px-2 py-0.5 rounded-full bg-surface-paleBlue border border-border-line">
                            Page {snip.page}
                          </span>
                          <span className="text-xs font-mono font-semibold text-ink-primary">
                            {snip.section}
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-ink-muted" /> : <ChevronDown className="w-4 h-4 text-ink-muted" />}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 text-xs font-mono text-ink-secondary italic border-t border-border-line leading-relaxed">
                          "{snip.text}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-line">
            <div className="text-xs font-mono text-ink-muted">
              Ready to configure experiment and audit metrics
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onProceedToConfig}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold bg-white hover:bg-canvas text-ink-primary border border-border-line transition-colors shadow-xs"
              >
                Inspect Experiment DAG
              </button>

              <button
                onClick={onProceedToAudit}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-semibold bg-deepBlue hover:bg-ink-primary text-white shadow-cta-glow transition-all flex items-center justify-center gap-2"
              >
                <span>Launch Metric Audit (/audit)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
