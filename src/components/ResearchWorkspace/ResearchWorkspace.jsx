import React from 'react';
import {
  FileUp,
  FileSearch,
  Sliders,
  Scale,
  FileText,
  Sparkles
} from 'lucide-react';
import PaperUpload from './PaperUpload';
import ExtractedInspector from './ExtractedInspector';
import ExperimentConfig from './ExperimentConfig';
import MetricAudit from './MetricAudit';
import ResultsReport from './ResultsReport';

export default function ResearchWorkspace({
  activeStage = 'upload',
  setActiveStage,
  uploadedFile,
  setUploadedFile,
  extractionResponse,
  setExtractionResponse,
  auditResult,
  setAuditResult,
  addToast,
}) {
  const tabs = [
    { id: 'upload', label: '1. Paper Intake', icon: FileUp, badge: uploadedFile ? 'Uploaded' : null },
    { id: 'inspector', label: '2. Evidence Inspector', icon: FileSearch, badge: extractionResponse ? 'Parsed' : null },
    { id: 'config', label: '3. Experiment DAG', icon: Sliders, badge: '501 Staged' },
    { id: 'audit', label: '4. Metric Audit', icon: Scale, badge: auditResult ? 'Audited' : 'Active' },
    { id: 'report', label: '5. Findings Report', icon: FileText, badge: auditResult ? 'Ready' : null },
  ];

  return (
    <section id="workspace" className="py-20 px-4 sm:px-6 lg:px-8 relative border-t border-border-line bg-canvas-light">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Headline */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-paleBlue text-deepBlue border border-border-line text-xs font-mono mb-3 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-steel" />
              <span>INTERACTIVE RESEARCH LAB BENCH</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-light text-ink-primary tracking-tight">
              Research Workspace & <span className="font-semibold text-deepBlue">Audit Protocol</span>
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary mt-2 max-w-2xl">
              Conduct an interactive reproducibility audit: Upload research papers, review extracted hyperparameters, configure the experiment DAG, and verify metric discrepancies.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
            <span className="w-2 h-2 rounded-full bg-status-teal animate-pulse" />
            <span className="text-ink-secondary font-medium">FastAPI Backend Integrated</span>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-white border border-border-line shadow-xs overflow-x-auto mb-8">
          {tabs.map((tab) => {
            const isSelected = activeStage === tab.id;
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveStage(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-xs transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-steel/40 ${
                  isSelected
                    ? 'bg-deepBlue text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-canvas'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-canvas text-ink-muted border border-border-line'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace Canvas Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-border-line shadow-card-subtle min-h-[500px]">
          {activeStage === 'upload' && (
            <PaperUpload
              uploadedFile={uploadedFile}
              setUploadedFile={setUploadedFile}
              extractionResponse={extractionResponse}
              setExtractionResponse={setExtractionResponse}
              onProceedToExtraction={() => setActiveStage('inspector')}
              addToast={addToast}
            />
          )}

          {activeStage === 'inspector' && (
            <ExtractedInspector
              extractionResponse={extractionResponse}
              uploadedFile={uploadedFile}
              onProceedToConfig={() => setActiveStage('config')}
              onProceedToAudit={() => setActiveStage('audit')}
            />
          )}

          {activeStage === 'config' && (
            <ExperimentConfig
              onProceedToAudit={() => setActiveStage('audit')}
              addToast={addToast}
            />
          )}

          {activeStage === 'audit' && (
            <MetricAudit
              auditResult={auditResult}
              setAuditResult={setAuditResult}
              onProceedToReport={() => setActiveStage('report')}
              addToast={addToast}
            />
          )}

          {activeStage === 'report' && (
            <ResultsReport
              auditResult={auditResult}
              uploadedFile={uploadedFile}
              onReturnToAudit={() => setActiveStage('audit')}
              onReturnToConfig={() => setActiveStage('config')}
              addToast={addToast}
            />
          )}
        </div>

      </div>
    </section>
  );
}
