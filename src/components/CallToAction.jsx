import React from 'react';
import { ArrowRight, Scale, ShieldCheck, Sparkles } from 'lucide-react';

export default function CallToAction({ onStartAudit }) {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-border-line bg-canvas overflow-hidden">
      {/* Background Soft Ambient Caustics */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-steel/10 via-surface-paleBlue/50 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-white/80 text-deepBlue text-xs font-mono mb-6 font-medium shadow-glass-pill backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-steel" />
          <span>SCIENTIFIC REPRODUCIBILITY ENGINE</span>
        </div>

        <h2 className="font-sans font-light text-4xl sm:text-6xl text-ink-primary tracking-tight leading-[1.08] mb-6">
          Every result <br />
          <span className="font-semibold text-deepBlue">deserves evidence.</span>
        </h2>

        <p className="text-sm sm:text-base text-ink-secondary max-w-xl mx-auto mb-8 leading-relaxed">
          Bridge the credibility gap in artificial intelligence. Validate claims,
          isolate hyperparameter divergence, and turn research into reproducible science.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onStartAudit}
            className="group px-8 py-4 rounded-full font-semibold text-sm bg-deepBlue hover:bg-ink-primary text-white shadow-cta-glow transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-steel shimmer-hover"
          >
            <Scale className="w-4 h-4 text-steel-light" />
            <span>Launch Research Audit Now</span>
            <div className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-all group-hover:translate-x-1">
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
