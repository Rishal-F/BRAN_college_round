import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Play,
  Layers,
  Shield,
} from 'lucide-react';
import GlassSphereVisual from './ui/GlassSphereVisual';

export default function HeroSection({
  onStartAudit,
  onExploreWorkflow,
  onSelectStage,
}) {
  const [activeStepIndex, setActiveStepIndex] = useState(2); // 0: 1K, 1: 10K, 2: 50K, 3: 100K
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const steps = [
    { label: '1K', title: 'PDF Extraction', desc: '1,000+ papers parsed into structured hyperparameter tables.' },
    { label: '10K', title: 'DAG Execution', desc: '10,000+ parameter combinations staged across cleanroom seeds.' },
    { label: '50K', title: 'MLflow Runs', desc: '50,000+ loss trajectories logged to deterministic servers.' },
    { label: '100K', title: 'Metric Audits', desc: '100,000+ tolerance assertions evaluated via POST /audit.' },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-[92vh] flex flex-col justify-between pt-6 sm:pt-10 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* Background Central Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-steel/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Grid: Headline, Central Rotating 3D Glass Sphere, and Floating AI-Driven Card */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center flex-1 my-auto">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Editorial Headline & Play Demo Button */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col items-start text-left z-20">
          
          {/* Eyebrow / Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs sm:text-sm font-sans text-ink-muted mb-4 tracking-normal"
          >
            Your research infrastructure
          </motion.div>

          {/* Master Headline matching reference image typographic balance */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans font-light text-4xl sm:text-6xl xl:text-[4.25rem] tracking-tight text-ink-primary leading-[1.05] mb-8"
          >
            Smarter Reproducibility <br />
            <span className="font-semibold text-deepBlue">Starts Here</span>
          </motion.h1>

          {/* Interactive Play Button & Tagline Row */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-4 mb-8"
          >
            {/* Pulsating Play Button */}
            <div className="relative flex items-center justify-center">
              {/* Concentric Ripple Waves */}
              <div className="absolute w-12 h-12 rounded-full bg-steel/20 ripple-ring-1 pointer-events-none" />
              <div className="absolute w-12 h-12 rounded-full bg-steel/15 ripple-ring-2 pointer-events-none" />
              <div className="absolute w-12 h-12 rounded-full bg-steel/10 ripple-ring-3 pointer-events-none" />

              <button
                onClick={() => {
                  setIsPlayingDemo(true);
                  if (onSelectStage) onSelectStage('audit');
                }}
                className="relative z-10 w-12 h-12 rounded-full bg-white border border-border-line shadow-md hover:shadow-lg flex items-center justify-center text-ink-primary hover:text-deepBlue hover:scale-105 active:scale-95 transition-all group focus:outline-none focus:ring-2 focus:ring-steel"
                title="Play Interactive Audit Demo"
                aria-label="Play Interactive Audit Demo"
              >
                <Play className="w-5 h-5 fill-current ml-0.5 text-deepBlue group-hover:text-steel transition-colors" />
              </button>
            </div>

            {/* Tagline */}
            <div className="text-sm font-sans font-normal text-ink-primary">
              <span className="font-semibold text-ink-primary">Inspect the Sphere.</span>{' '}
              <span className="text-ink-secondary">Verify What Matters.</span>
            </div>
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-3 w-full sm:w-auto"
          >
            <button
              onClick={onStartAudit}
              className="group w-full sm:w-auto px-6 py-3.5 rounded-full font-semibold text-sm bg-deepBlue hover:bg-ink-primary text-white shadow-cta-glow transition-all flex items-center justify-between sm:justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-steel shimmer-hover"
            >
              <span>Start an audit</span>
              <div className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-transform group-hover:translate-x-1">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </button>

            <button
              onClick={onExploreWorkflow}
              className="w-full sm:w-auto px-5 py-3.5 rounded-full font-semibold text-sm bg-white hover:bg-canvas-light text-ink-primary border border-border-line transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-border-strong shadow-xs hover:border-steel/40"
            >
              <Layers className="w-4 h-4 text-steel" />
              <span>Explore Workflow</span>
            </button>
          </motion.div>

        </div>

        {/* ========================================================================= */}
        {/* CENTER COLUMN: The Slowly Rotating 3D Glass Sphere & Intersecting Disc */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 flex items-center justify-center relative z-10 my-4 lg:my-0">
          <GlassSphereVisual onInteract={() => {}} />
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Floating Frosted Glass Card (AI-Driven) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 flex justify-center lg:justify-end z-20">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full max-w-[340px] rounded-3xl glass-card-sentinel p-6 animate-float-slow clean-card-hover"
          >
            {/* Card Header: AI-Driven & Shield Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-sans font-semibold text-base text-ink-primary">
                  AI-Driven
                </span>
                {/* Breathing Status Dot */}
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-steel opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-steel" />
                </span>
              </div>

              {/* Shield Icon in Glass Circle */}
              <div className="w-10 h-10 rounded-full bg-white/90 border border-white/80 shadow-xs flex items-center justify-center text-deepBlue">
                <Shield className="w-5 h-5 text-steel" />
              </div>
            </div>

            {/* Subtitle */}
            <div className="text-xs text-ink-secondary leading-snug mb-6">
              Cloud Infrastructure <br />
              Protection & Verification
            </div>

            {/* Discrete Stepper Ticks: 1K, 10K, 50K, 100K */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-medium text-ink-muted px-1">
                {steps.map((step, idx) => (
                  <button
                    key={step.label}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`transition-colors hover:text-deepBlue ${
                      activeStepIndex === idx ? 'text-deepBlue font-bold' : ''
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>

              {/* Interactive Progress / Range Track */}
              <div className="relative">
                <div className="h-2 bg-border-subtle rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-steel rounded-full"
                    animate={{
                      width: `${((activeStepIndex + 1) / steps.length) * 100}%`,
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                  />
                </div>
                
                {/* Hidden slider for interactive dragging */}
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="1"
                  value={activeStepIndex}
                  onChange={(e) => setActiveStepIndex(parseInt(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  aria-label="Select audit capacity step"
                />
              </div>

              {/* Active Step Telemetry Display */}
              <div className="pt-3 border-t border-white/40">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="font-semibold text-ink-primary">
                    {steps[activeStepIndex].title}
                  </span>
                  <span className="text-steel font-bold">
                    {steps[activeStepIndex].label}+ Verified
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  {steps[activeStepIndex].desc}
                </p>
              </div>

              {/* Quick Launch Action */}
              <button
                onClick={() => {
                  if (onSelectStage) onSelectStage('audit');
                }}
                className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-white/80 hover:bg-white text-deepBlue border border-white shadow-xs transition-all flex items-center justify-center gap-1.5 hover:shadow-sm"
              >
                <span>Inspect Stage</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </motion.div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* BOTTOM ROW: Large Editorial Stats & "Meet CrisisGrid" Floating Pill */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto w-full pt-8 sm:pt-12 border-t border-border-line/60 flex flex-col md:flex-row items-start md:items-end justify-between gap-6 z-20">
        
        {/* Left Stats matching the 112+ / 55K+ layout from reference image */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-baseline gap-6 sm:gap-10"
        >
          {/* Stat 1 */}
          <div className="flex items-baseline gap-3">
            <span className="font-sans font-light text-4xl sm:text-5xl lg:text-6xl text-ink-primary tracking-tight">
              112<span className="text-steel font-normal">+</span>
            </span>
            <div className="text-xs font-sans text-ink-muted leading-tight">
              Papers <br />
              Audited Globally
            </div>
          </div>

          {/* Divider Slash */}
          <span className="text-3xl sm:text-4xl font-extralight text-border-strong select-none">
            /
          </span>

          {/* Stat 2 */}
          <div className="flex items-baseline gap-3">
            <span className="font-sans font-light text-4xl sm:text-5xl lg:text-6xl text-ink-primary tracking-tight">
              55K<span className="text-steel font-normal">+</span>
            </span>
            <div className="text-xs font-sans text-ink-muted leading-tight">
              Metric Claims <br />
              Empirically Verified
            </div>
          </div>
        </motion.div>

        {/* Right Interactive "Meet CrisisGrid" Pill matching reference image */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          onClick={() => {
            if (onSelectStage) onSelectStage('upload');
          }}
          className="cursor-pointer group flex items-center gap-3.5 pl-3 pr-2 py-2 rounded-full bg-white/90 border border-white/80 shadow-glass-pill hover:shadow-lg backdrop-blur-xl transition-all hover:-translate-y-0.5"
        >
          {/* Mini Iridescent Glass Orb Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-steel/30 via-white to-steel/40 border border-white shadow-inner flex items-center justify-center overflow-hidden">
            <div className="w-full h-full rounded-full animate-spin-slow opacity-80 bg-[radial-gradient(circle_at_30%_30%,_white_0%,_transparent_70%)]" />
          </div>

          {/* Label */}
          <span className="text-xs font-semibold text-ink-primary group-hover:text-deepBlue transition-colors pr-1">
            Meet CrisisGrid
          </span>

          {/* Dark Arrow Knob */}
          <div className="w-8 h-8 rounded-full bg-deepBlue group-hover:bg-ink-primary flex items-center justify-center transition-all group-hover:scale-105 shadow-sm">
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
          </div>
        </motion.div>

      </div>

    </section>
  );
}
