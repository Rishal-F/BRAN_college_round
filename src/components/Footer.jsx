import React from 'react';
import { Cpu, Terminal, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Footer({ backendStatus }) {
  const team = [
    { role: 'Member 1', task: 'PDF Extraction & Document Parser', status: 'Pending Integration' },
    { role: 'Member 2', task: 'MLflow & Experiment Execution Runner', status: 'HTTP 501 Staged' },
    { role: 'Member 3', task: 'Creative Frontend, Motion & API Integration', status: 'Active (You)' },
    { role: 'Member 4', task: 'FastAPI Backend & Metric Audit Engine', status: 'Operational' },
  ];

  return (
    <footer className="w-full border-t border-border-line bg-white py-16 px-4 sm:px-6 lg:px-8 relative z-10 text-ink-muted">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-surface-paleBlue border border-border-line flex items-center justify-center text-deepBlue shadow-2xs">
                <Cpu className="w-4 h-4 text-steel" />
              </div>
              <span className="font-sans font-semibold text-ink-primary tracking-tight text-lg">
                Crisis<span className="text-steel font-normal">Grid</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-canvas border border-border-line text-ink-muted">
                12-Hour Build
              </span>
            </div>
            
            <p className="text-xs text-ink-secondary max-w-sm leading-relaxed">
              An evidence-backed scientific reproducibility platform that converts research claims into verifiable empirical audits.
            </p>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-steel">
                <Terminal className="w-3.5 h-3.5" />
                <span>FastAPI + React + Vite</span>
              </div>
            </div>
          </div>

          {/* Team Division of Responsibilities Matrix */}
          <div className="md:col-span-7">
            <div className="text-xs font-mono text-ink-primary uppercase tracking-wider mb-4 flex items-center justify-between font-semibold">
              <span>Team Division of Responsibilities</span>
              <span className="text-[10px] text-steel">CrisisGrid Protocol</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {team.map((member, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-canvas border border-border-line hover:border-steel/40 hover:bg-white hover:-translate-y-0.5 transition-all flex flex-col justify-between text-xs group shadow-2xs"
                >
                  <div className="flex items-center justify-between font-mono mb-1.5">
                    <span className="font-semibold text-ink-primary group-hover:text-deepBlue transition-colors">
                      {member.role}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      member.status.includes('Active') || member.status.includes('Operational')
                        ? 'text-status-teal bg-status-tealSoft border border-status-teal/20'
                        : 'text-status-amber bg-status-amberSoft border border-status-amber/20'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-secondary leading-relaxed">
                    {member.task}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div>
            CrisisGrid — ML Research Reproducibility Engine.
          </div>

          <div className="flex items-center gap-4 text-ink-secondary">
            <span>FastAPI: http://127.0.0.1:8000</span>
            <span>•</span>
            <span>Vite: http://localhost:5173</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
