import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileUp,
  FileSearch,
  Sliders,
  Play,
  Scale,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function WorkflowPipeline({
  uploadedFile,
  extractionStatus,
  auditResult,
  onSelectStage,
}) {
  const [selectedWorkflowStage, setSelectedWorkflowStage] = useState('paper');

  const getStageStatus = (stageId) => {
    switch (stageId) {
      case 'paper':
        if (uploadedFile) return { label: 'Paper Uploaded', type: 'success' };
        return { label: 'Waiting for paper', type: 'idle' };
      case 'evidence':
        if (extractionStatus === 'integration_pending') return { label: 'Extraction pending', type: 'pending' };
        if (extractionStatus === 'success') return { label: 'Extracted & parsed', type: 'success' };
        if (uploadedFile) return { label: 'Ready for extraction', type: 'idle' };
        return { label: 'Awaiting paper', type: 'idle' };
      case 'config':
        return { label: 'Configurable DAG', type: 'idle' };
      case 'experiment':
        return { label: 'Runner Staged (501)', type: 'warning' };
      case 'comparison':
        if (auditResult) return { label: 'Audit Complete (/audit)', type: 'success' };
        return { label: 'Audit Ready', type: 'operational' };
      default:
        return { label: 'Idle', type: 'idle' };
    }
  };

  const stages = [
    {
      id: 'paper',
      num: '01',
      name: 'Paper Intake',
      shortDesc: 'PDF Upload & Integrity',
      icon: FileUp,
      workspaceStage: 'upload',
      description: 'Upload the research paper PDF. The intake pipeline performs header validation and prepares the document for extraction.',
      teamMember: 'Member 3 & Member 4',
      apiEndpoint: 'POST /extract',
    },
    {
      id: 'evidence',
      num: '02',
      name: 'Evidence Extraction',
      shortDesc: 'Metadata & Hyperparameters',
      icon: FileSearch,
      workspaceStage: 'inspector',
      description: 'Parses model topology, dataset splits, optimization parameters, and reported baseline metrics while detecting unstated ambiguities.',
      teamMember: 'Member 1 (Extractor Service)',
      apiEndpoint: 'POST /extract (Pending)',
    },
    {
      id: 'config',
      num: '03',
      name: 'Configuration',
      shortDesc: 'Deterministic Re-run Spec',
      icon: Sliders,
      workspaceStage: 'config',
      description: 'Inspects standardized execution graph: datasets, deterministic seeds, precision mode, and MLflow logging hooks.',
      teamMember: 'Member 2 & 3',
      apiEndpoint: 'DAG Config Standard',
    },
    {
      id: 'experiment',
      num: '04',
      name: 'Experiment Grid',
      shortDesc: 'MLflow Monitored Run',
      icon: Play,
      workspaceStage: 'config',
      description: 'Executes the model training or validation benchmark inside a reproducible runtime with telemetry streaming to MLflow.',
      teamMember: 'Member 2 (Experiment Runner)',
      apiEndpoint: 'POST /run (HTTP 501 Staged)',
    },
    {
      id: 'comparison',
      num: '05',
      name: 'Metric Audit',
      shortDesc: 'Discrepancy Analysis',
      icon: Scale,
      workspaceStage: 'audit',
      description: 'Evaluates reported versus measured metrics using rigorous tolerance thresholds and discrepancy detection via the FastAPI audit engine.',
      teamMember: 'Member 4 & 3',
      apiEndpoint: 'POST /audit (Operational)',
    },
  ];

  const current = stages.find((s) => s.id === selectedWorkflowStage) || stages[0];
  const Icon = current.icon;
  const currentStatus = getStageStatus(current.id);

  return (
    <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 relative border-t border-border-line bg-canvas">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-paleBlue text-deepBlue border border-border-line text-xs font-mono mb-4 font-medium shadow-2xs">
            <Sliders className="w-3.5 h-3.5 text-steel" />
            <span>INTERACTIVE RESEARCH PIPELINE</span>
          </div>
          <h2 className="font-sans font-light text-3xl sm:text-5xl text-ink-primary tracking-tight">
            The CrisisGrid <span className="font-semibold text-deepBlue">Investigation Workflow</span>
          </h2>
          <p className="text-sm sm:text-base text-ink-secondary mt-4 leading-relaxed">
            Click any stage in the pipeline to examine its role, team ownership, backend integration status, and live application state.
          </p>
        </div>

        {/* 5-Stage Horizontal Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
          {stages.map((stage) => {
            const isSelected = selectedWorkflowStage === stage.id;
            const StageIcon = stage.icon;
            const status = getStageStatus(stage.id);

            return (
              <button
                key={stage.id}
                onClick={() => setSelectedWorkflowStage(stage.id)}
                className={`p-4 rounded-2xl text-left transition-all border relative flex flex-col justify-between overflow-hidden group focus:outline-none focus:ring-2 focus:ring-steel/40 ${
                  isSelected
                    ? 'bg-white border-steel shadow-md ring-1 ring-steel/20 -translate-y-0.5'
                    : 'bg-white/60 border-border-line hover:border-steel/40 hover:bg-white hover:-translate-y-0.5 shadow-2xs'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activePipelineIndicator"
                    className="absolute top-0 left-0 right-0 h-1 bg-steel rounded-t-2xl"
                  />
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-mono text-xs font-semibold ${isSelected ? 'text-steel' : 'text-ink-muted'}`}>
                      {stage.num}
                    </span>
                    <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-surface-paleBlue text-deepBlue' : 'bg-canvas text-ink-secondary border border-border-line group-hover:border-steel/40'}`}>
                      <StageIcon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className={`font-semibold text-sm leading-tight ${isSelected ? 'text-ink-primary' : 'text-ink-secondary'}`}>
                    {stage.name}
                  </h3>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {stage.shortDesc}
                  </p>
                </div>

                {/* Status indicator */}
                <div className="mt-4 pt-2.5 border-t border-border-line flex items-center gap-1.5 text-[10px] font-mono">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status.type === 'success'
                        ? 'bg-status-teal'
                        : status.type === 'operational'
                        ? 'bg-status-teal animate-pulse'
                        : status.type === 'pending'
                        ? 'bg-status-amber'
                        : status.type === 'warning'
                        ? 'bg-status-amber'
                        : 'bg-ink-muted'
                    }`}
                  />
                  <span className="text-ink-secondary truncate font-medium">
                    {status.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Drawer */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border-line shadow-card-subtle">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-8">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-mono text-xs font-semibold text-deepBlue px-2.5 py-1 rounded-full bg-surface-paleBlue border border-border-line">
                    STAGE {current.num}: {current.name.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs text-ink-muted px-2.5 py-1 rounded-full bg-canvas border border-border-line">
                    Owner: {current.teamMember}
                  </span>
                  <span className="font-mono text-xs text-steel px-2.5 py-1 rounded-full bg-surface-paleBlue border border-border-line">
                    {current.apiEndpoint}
                  </span>
                </div>

                <h3 className="text-2xl font-sans font-semibold text-ink-primary mb-2">
                  {current.name}
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed mb-6">
                  {current.description}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => onSelectStage && onSelectStage(current.workspaceStage)}
                    className="group px-5 py-2.5 rounded-full text-xs font-semibold bg-deepBlue hover:bg-ink-primary text-white shadow-cta-glow transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-steel active:scale-95"
                  >
                    <span>Open in Research Lab</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
                    <span className="text-ink-secondary">Live Stage State:</span>
                    <span className="text-deepBlue font-semibold">{currentStatus.label}</span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown Panel */}
              <div className="lg:col-span-4 p-5 rounded-2xl bg-canvas border border-border-line">
                <div className="text-xs font-mono text-ink-muted uppercase mb-3 flex items-center justify-between font-medium">
                  <span>Integration Reality</span>
                  {current.id === 'comparison' && (
                    <span className="text-status-teal font-bold">100% Operational</span>
                  )}
                  {current.id === 'paper' && (
                    <span className="text-steel font-bold">Intake Live</span>
                  )}
                  {current.id === 'evidence' && (
                    <span className="text-status-amber font-bold">Extractor Pending</span>
                  )}
                  {current.id === 'experiment' && (
                    <span className="text-status-amber font-bold">HTTP 501 Staged</span>
                  )}
                  {current.id === 'config' && (
                    <span className="text-deepBlue font-bold">DAG Spec Ready</span>
                  )}
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-border-line">
                    <span className="text-ink-muted">Active Endpoint</span>
                    <span className="text-ink-primary font-medium">{current.apiEndpoint.split(' ')[1] || current.apiEndpoint}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border-line">
                    <span className="text-ink-muted">Live State</span>
                    <span className="text-ink-primary font-medium">{currentStatus.label}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ink-muted">Data Contract</span>
                    <span className="text-ink-primary font-medium">FastAPI Pydantic v1</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
