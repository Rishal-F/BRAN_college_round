import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  RefreshCw,
  Home,
  Grid,
  Menu,
  X,
} from 'lucide-react';

export default function Header({
  backendStatus = 'checking', // 'connected' | 'checking' | 'offline'
  onRetryBackend,
  onNavigateToStage,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'product'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'explore') {
      const el = document.getElementById('problem');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const el = document.getElementById('workspace');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      if (onNavigateToStage) onNavigateToStage('upload');
    }
  };

  return (
    <header className="sticky top-4 z-40 w-full px-4 sm:px-6 lg:px-8 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Minimal Compass/Sphere Mark */}
        <a
          href="#hero"
          className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-steel/40 rounded-2xl p-1"
        >
          {/* Rotating Compass / Scientific Grid Orb */}
          <div className="w-9 h-9 rounded-xl bg-white border border-border-line shadow-xs flex items-center justify-center p-1.5 group-hover:border-steel transition-all group-hover:scale-105">
            <svg viewBox="0 0 36 36" fill="none" className="w-full h-full transform group-hover:rotate-45 transition-transform duration-500" aria-hidden="true">
              <circle cx="18" cy="18" r="16" stroke="#142033" strokeWidth="1.5" />
              <circle cx="18" cy="18" r="8" stroke="#426A91" strokeWidth="1.5" />
              <path d="M18 2v32M2 18h32" stroke="#142033" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="18" cy="18" r="2.5" fill="#263F5B" />
            </svg>
          </div>

          <span className="font-sans font-semibold text-lg text-ink-primary tracking-tight">
            Crisis<span className="font-light text-steel">Grid</span>
          </span>
        </a>

        {/* Center: Floating Capsule Navigation Pill matching Reference Image */}
        <div className="hidden md:flex items-center p-1.5 rounded-full bg-white/85 border border-white/90 shadow-glass-pill backdrop-blur-xl">
          <button
            onClick={() => handleTabClick('explore')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'explore'
                ? 'bg-canvas text-deepBlue font-semibold shadow-2xs'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-black/5'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-steel" />
            <span>Explore</span>
          </button>

          <span className="h-4 w-px bg-border-line mx-1" />

          <button
            onClick={() => handleTabClick('product')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'product'
                ? 'bg-canvas text-deepBlue font-semibold shadow-2xs'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-black/5'
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-steel" />
            <span>Product</span>
          </button>
        </div>

        {/* Right Action Area: Live Health Ping & Capsule Button with Knob */}
        <div className="flex items-center gap-3">
          
          {/* Live Backend Connection Indicator */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
              backendStatus === 'connected'
                ? 'bg-status-tealSoft border-status-teal/30 text-status-teal'
                : backendStatus === 'checking'
                ? 'bg-status-amberSoft border-status-amber/30 text-status-amber'
                : 'bg-status-redSoft border-status-red/30 text-status-red'
            }`}
            title="FastAPI Backend Health (http://127.0.0.1:8000/health)"
          >
            <span className="relative flex h-2 w-2">
              {backendStatus === 'connected' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-teal opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  backendStatus === 'connected'
                    ? 'bg-status-teal'
                    : backendStatus === 'checking'
                    ? 'bg-status-amber animate-pulse'
                    : 'bg-status-red'
                }`}
              />
            </span>

            <span className="font-medium text-[11px]">
              {backendStatus === 'connected'
                ? 'API Active'
                : backendStatus === 'checking'
                ? 'Checking...'
                : 'Offline'}
            </span>

            <button
              onClick={onRetryBackend}
              title="Ping backend health"
              className="p-0.5 hover:bg-black/5 rounded transition-colors focus:outline-none"
              aria-label="Retry connection to backend"
            >
              <RefreshCw
                className={`w-3 h-3 ${
                  backendStatus === 'checking' ? 'animate-spin text-status-amber' : 'text-current'
                }`}
              />
            </button>
          </div>

          {/* Primary CTA Capsule with Rounded Arrow Knob matching reference image */}
          <a
            href="#workspace"
            onClick={() => {
              if (onNavigateToStage) onNavigateToStage('upload');
            }}
            className="group flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full text-xs font-semibold bg-deepBlue hover:bg-ink-primary text-white shadow-cta-glow transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-steel"
          >
            <span>Get free audit</span>
            <div className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-all group-hover:translate-x-0.5">
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </div>
          </a>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white border border-border-line text-ink-primary focus:outline-none focus:ring-2 focus:ring-steel"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden mt-3 p-4 rounded-3xl bg-white/95 border border-border-line shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => {
                handleTabClick('explore');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-secondary hover:bg-canvas text-left"
            >
              <Home className="w-4 h-4 text-steel" />
              <span>Explore The Problem</span>
            </button>
            <button
              onClick={() => {
                handleTabClick('product');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-secondary hover:bg-canvas text-left"
            >
              <Grid className="w-4 h-4 text-steel" />
              <span>Research Lab / Product</span>
            </button>
            <a
              href="#workspace"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onNavigateToStage) onNavigateToStage('audit');
              }}
              className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold bg-deepBlue text-white shadow-md"
            >
              <span>Launch Metric Audit (POST /audit)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
