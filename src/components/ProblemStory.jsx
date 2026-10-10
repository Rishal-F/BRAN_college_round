import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck2,
  FileQuestion,
  PlaySquare,
  TrendingDown,
  SearchCheck,
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function ProblemStory() {
  const [activeStep, setActiveStep] = useState(0);

  const storySteps = [
    {
      id: 0,
      stepNum: "01",
      title: "The Published Claim",
      subtitle: "A baseline validation accuracy is reported in peer-reviewed literature.",
      icon: FileCheck2,
      badge: "Published Benchmark",
      quote: "Our architecture achieves 95.0% validation accuracy on standard benchmark splits.",
      observation: "The paper establishes a benchmark claim with high credibility.",
      risk: "Implementation details, precise random seeds, and data pipeline nuances remain unstated.",
    },
    {
      id: 1,
      stepNum: "02",
      title: "The Missing Details",
      subtitle: "Hyperparameters, hardware specifics, or data seeds are omitted.",
      icon: FileQuestion,
      badge: "Methodological Gap",
      quote: "Standard training parameters and learning rates were employed without further specification.",
      observation: "Critical variables like warmup schedules and precision formats are left implicit.",
      risk: "Small undisclosed differences can cause notable variance during neural network convergence.",
    },
    {
      id: 2,
      stepNum: "03",
      title: "The Replication Attempt",
      subtitle: "An independent lab executes the implementation from available details.",
      icon: PlaySquare,
      badge: "Controlled Re-run",
      quote: "Reconstructing training pipeline using specified architecture and standard initialization.",
      observation: "The independent researcher runs the experiment under standardized cleanroom conditions.",
      risk: "Without end-to-end tracked artifacts, minor environmental divergence affects results.",
    },
    {
      id: 3,
      stepNum: "04",
      title: "The Metric Divergence",
      subtitle: "The measured result differs from the published paper claim.",
      icon: TrendingDown,
      badge: "Metric Discrepancy",
      quote: "Measured validation accuracy reaches 89.0%, falling outside the standard tolerance threshold.",
      observation: "The actual execution produces a lower metric than what was claimed in the paper.",
      risk: "Without automated audit tools, determining why the gap exists requires manual debugging.",
    },
    {
      id: 4,
      stepNum: "05",
      title: "The CrisisGrid Audit",
      subtitle: "Structured extraction, DAG execution, and tolerance auditing.",
      icon: SearchCheck,
      badge: "Evidence-Backed Protocol",
      quote: "CrisisGrid isolates exact divergence points between reported methodologies and measured runs.",
      observation: "FastAPI metric auditing, evidence parsing, and MLflow tracking convert assumptions into empirical evidence.",
      risk: "Transparent limitations ensure reproducible science without exaggerated guarantees.",
    }
  ];

  const current = storySteps[activeStep];
  const Icon = current.icon;

  return (
    <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 relative border-t border-border-line bg-canvas-light">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-paleBlue text-deepBlue border border-border-line text-xs font-mono mb-4 font-medium shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-steel" />
            <span>THE REPRODUCIBILITY CHALLENGE</span>
          </div>
          <h2 className="font-sans font-light text-3xl sm:text-5xl text-ink-primary tracking-tight">
            Why machine-learning results <br className="hidden sm:block" />
            <span className="font-semibold text-deepBlue">fail to replicate</span>
          </h2>
          <p className="text-sm sm:text-base text-ink-secondary mt-4 leading-relaxed">
            In modern artificial intelligence research, a published claim is only the starting point.
            Explore the five breakdown stages of scientific replication:
          </p>
        </div>

        {/* Interactive 5-Step Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {storySteps.map((step, idx) => {
            const isSelected = activeStep === idx;
            const StepIcon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`flex flex-col items-start p-4 rounded-2xl text-left transition-all border relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-steel/40 ${
                  isSelected
                    ? 'bg-white border-steel shadow-md ring-1 ring-steel/20 -translate-y-0.5'
                    : 'bg-white/60 border-border-line hover:border-steel/40 hover:bg-white hover:-translate-y-0.5 shadow-2xs'
                }`}
              >
                {/* Active Indicator Top Bar */}
                {isSelected && (
                  <motion.div
                    layoutId="activeProblemIndicator"
                    className="absolute top-0 left-0 right-0 h-1 bg-steel rounded-t-2xl"
                  />
                )}

                <div className="flex items-center justify-between w-full mb-2.5">
                  <span className={`font-mono text-xs font-semibold ${isSelected ? 'text-steel' : 'text-ink-muted'}`}>
                    {step.stepNum}
                  </span>
                  <div className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-surface-paleBlue text-deepBlue' : 'text-ink-muted group-hover:text-steel'}`}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-xs font-semibold leading-tight line-clamp-1 ${isSelected ? 'text-ink-primary font-bold' : 'text-ink-secondary'}`}>
                  {step.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Detailed Breakdown Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-border-line shadow-card-subtle relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Description Column */}
              <div className="lg:col-span-7">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-xs font-semibold text-deepBlue px-2.5 py-0.5 rounded-full bg-surface-paleBlue border border-border-line">
                    STAGE {current.stepNum} OF 05
                  </span>
                  <span className="text-xs font-mono text-ink-muted">
                    {current.badge}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-sans font-semibold text-ink-primary mb-2">
                  {current.title}
                </h3>
                
                <p className="text-sm sm:text-base text-ink-secondary mb-6 leading-relaxed">
                  {current.subtitle}
                </p>

                {/* Quotation block */}
                <div className="p-4 rounded-2xl bg-canvas border-l-4 border-steel border-y border-r border-border-line mb-6 font-mono text-xs text-ink-primary italic">
                  "{current.quote}"
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-canvas border border-border-line hover:border-steel/30 transition-colors">
                    <div className="text-[11px] font-mono text-steel uppercase font-semibold mb-1">
                      Observation
                    </div>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {current.observation}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-canvas border border-border-line hover:border-status-amber/40 transition-colors">
                    <div className="text-[11px] font-mono text-status-amber uppercase font-semibold mb-1">
                      Reproducibility Risk
                    </div>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      {current.risk}
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Demonstration Widget */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                <div className="p-6 rounded-2xl bg-canvas border border-border-line shadow-xs">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-line">
                    <span className="text-xs font-mono text-ink-muted">Scientific Impact Simulator</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-border-line text-ink-secondary">
                      Scenario {current.stepNum}
                    </span>
                  </div>

                  {activeStep === 0 && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between text-ink-secondary">
                        <span>Reported Metric (Paper)</span>
                        <span className="text-steel font-bold">95.0% Top-1</span>
                      </div>
                      <div className="h-2.5 bg-white border border-border-line rounded-full overflow-hidden">
                        <div className="w-[95%] h-full bg-steel rounded-full" />
                      </div>
                      <div className="text-[11px] text-ink-muted">Claimed benchmark from published text.</div>
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="space-y-2.5 font-mono text-xs">
                      <div className="text-status-amber font-semibold">Unstated Variables Detected:</div>
                      <div className="space-y-1 text-[11px] text-ink-secondary">
                        <div className="flex items-center gap-1.5"><span className="text-status-amber">✕</span> Random Seed: Unspecified</div>
                        <div className="flex items-center gap-1.5"><span className="text-status-amber">✕</span> Warmup Schedule: Unspecified</div>
                        <div className="flex items-center gap-1.5"><span className="text-status-amber">✕</span> Exact Hardware & Precision: Unspecified</div>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="text-deepBlue font-semibold">Replication Environment:</div>
                      <div className="p-3 rounded-xl bg-white border border-border-line text-[11px] text-ink-secondary space-y-1">
                        <div>Runtime: PyTorch 2.2 Standard Environment</div>
                        <div>Batch Size: 256 / Seed: 42</div>
                        <div>Precision: FP16 Mixed Precision</div>
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between text-ink-secondary">
                        <span>Reported vs Measured</span>
                        <span className="text-status-red font-bold">Δ 6.00 pp Discrepancy</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 bg-white border border-border-line rounded-full overflow-hidden">
                          <div className="w-[95%] h-full bg-steel rounded-full" title="Reported 95%" />
                        </div>
                        <div className="h-2 bg-white border border-border-line rounded-full overflow-hidden">
                          <div className="w-[89%] h-full bg-status-red rounded-full" title="Measured 89%" />
                        </div>
                      </div>
                      <div className="text-[11px] text-status-red font-medium">Outcome: Divergence exceeds ±2.0% tolerance.</div>
                    </div>
                  )}

                  {activeStep === 4 && (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="text-status-teal font-semibold flex items-center gap-1.5">
                        <SearchCheck className="w-4 h-4" /> CrisisGrid Audit Engine
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-status-teal/30 text-[11px] text-ink-secondary space-y-1">
                        <div className="text-ink-primary font-semibold">Status: Discrepancy Verified</div>
                        <div>Root Cause: Omitted Warmup Slope</div>
                        <div>Endpoint: POST /audit (Active)</div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-border-line flex justify-between items-center text-[11px]">
                    <span className="text-ink-muted font-mono">Interactive Walkthrough</span>
                    <button
                      onClick={() => setActiveStep((prev) => (prev + 1) % storySteps.length)}
                      className="text-steel hover:text-deepBlue flex items-center gap-1 font-semibold group"
                    >
                      <span>Next Stage</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </button>
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
