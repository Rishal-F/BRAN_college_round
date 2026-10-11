import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sparkles, Shield } from 'lucide-react';

export default function GlassSphereVisual({ onInteract }) {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tilt tracking with physics spring
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [14, -14]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-18, 18]), springConfig);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[540px] aspect-square mx-auto flex items-center justify-center perspective-1200 cursor-grab active:cursor-grabbing select-none group"
    >
      {/* Soft Light Caustics & Floor Radiance */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[85%] h-[85%] rounded-full bg-gradient-to-tr from-steel/15 via-surface-paleBlue/40 to-white/70 blur-3xl opacity-70 group-hover:opacity-95 transition-opacity duration-700" />
        <div className="absolute bottom-6 w-[70%] h-[24px] bg-gradient-to-r from-transparent via-[#142033]/12 to-transparent rounded-[100%] blur-md transform scale-y-50 group-hover:scale-105 transition-transform duration-500" />
      </div>

      {/* 3D Tilted Interactive Sphere Assembly */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-[340px] sm:w-[400px] h-[340px] sm:h-[400px] flex items-center justify-center"
      >
        {/* ========================================================================= */}
        {/* 1. BACK SECTION OF THE ANGLED INTERSECTING GLASS RING / DISH */}
        {/* ========================================================================= */}
        <div
          className="absolute inset-[-15%] pointer-events-none flex items-center justify-center"
          style={{
            transform: 'rotateX(58deg) rotateY(-18deg) rotateZ(35deg) translateZ(-30px)',
          }}
        >
          {/* Slowly rotating outer glass disc/ring */}
          <div className="relative w-full h-full rounded-[50%] border-[2px] border-white/70 shadow-[0_0_25px_rgba(66,106,145,0.18)] animate-spin-slow">
            {/* Glass rim thickness */}
            <div className="absolute inset-1 rounded-[50%] border border-white/50 bg-gradient-to-tr from-white/20 via-steel/10 to-white/40 backdrop-blur-[2px]" />
            
            {/* Shimmering specular arc on the back ring */}
            <div className="absolute top-[10%] left-[20%] w-[35%] h-[4px] bg-white rounded-full blur-[1px] opacity-80" />
            <div className="absolute bottom-[15%] right-[25%] w-[25%] h-[3px] bg-steel/40 rounded-full blur-[1px] opacity-60" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTRAL 3D REFRACTIVE OPTICAL GLASS SPHERE */}
        {/* ========================================================================= */}
        <div
          className="relative w-[240px] sm:w-[280px] h-[240px] sm:h-[280px] rounded-full overflow-hidden flex items-center justify-center shadow-[0_20px_50px_rgba(20,32,51,0.18),0_0_0_1px_rgba(255,255,255,0.85)_inset]"
          style={{
            transform: 'translateZ(20px)',
            background: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.92) 0%, rgba(232,238,244,0.65) 25%, rgba(185,208,232,0.35) 55%, rgba(66,106,145,0.2) 80%, rgba(20,32,51,0.3) 100%)',
          }}
        >
          {/* Internal Refraction Equatorial Seam (as seen in ConSentinel image) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-[110%] h-[3px] bg-gradient-to-r from-transparent via-white/80 to-transparent blur-[0.5px] transform rotate-[-8deg] shadow-[0_0_8px_rgba(255,255,255,0.9)]"
            />
            <div
              className="w-[100%] h-[1px] bg-gradient-to-r from-transparent via-steel/50 to-transparent transform rotate-[-8deg] translate-y-1"
            />
          </div>

          {/* Continuous Slow Rotating Internal Caustics / Optical Flow */}
          <div className="absolute inset-0 rounded-full animate-spin-slow opacity-60 pointer-events-none">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
              <defs>
                <linearGradient id="causticGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#5B84AC" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
                <radialGradient id="specularCore" cx="40%" cy="30%" r="60%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#E8EEF4" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#263F5B" stopOpacity="0.1" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="90" fill="url(#specularCore)" />
              <path
                d="M 40 100 C 60 50, 140 50, 160 100 C 140 150, 60 150, 40 100 Z"
                stroke="url(#causticGrad)"
                strokeWidth="2.5"
                fill="none"
                opacity="0.75"
              />
              <ellipse
                cx="100"
                cy="100"
                rx="75"
                ry="35"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.2"
                transform="rotate(25 100 100)"
              />
            </svg>
          </div>

          {/* Reverse Rotating Secondary Refraction Wave */}
          <div className="absolute inset-0 rounded-full animate-spin-slow-reverse opacity-40 pointer-events-none">
            <div className="absolute inset-4 rounded-full border border-white/60 bg-gradient-to-bl from-white/30 via-transparent to-steel/20" />
          </div>

          {/* Top-Left Specular Rim Light & High-Gloss Flare (Reflective Glass Surface) */}
          <div className="absolute top-4 left-6 w-20 h-12 bg-white/90 rounded-[50%] blur-[2px] transform -rotate-35 pointer-events-none" />
          <div className="absolute top-6 left-10 w-6 h-3 bg-white rounded-full blur-[0.5px] pointer-events-none" />

          {/* Bottom-Right Caustic Bounce Glow */}
          <div className="absolute bottom-5 right-7 w-24 h-10 bg-steel/30 rounded-[50%] blur-[6px] transform -rotate-25 pointer-events-none" />
          <div className="absolute bottom-4 right-10 w-12 h-4 bg-white/60 rounded-[50%] blur-[1px] pointer-events-none" />

          {/* Center Subtle Interactive Watermark / Compass Needle */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center pointer-events-none">
            <div className="w-10 h-10 rounded-full border border-white/60 bg-white/30 backdrop-blur-md flex items-center justify-center shadow-inner mb-1">
              <Sparkles className="w-4 h-4 text-steel animate-pulse" />
            </div>
            <span className="text-[9px] font-mono font-bold tracking-widest text-deepBlue/80 uppercase">
              CRISISGRID
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FRONT SECTION OF THE ANGLED INTERSECTING GLASS RING / DISH */}
        {/* ========================================================================= */}
        <div
          className="absolute inset-[-15%] pointer-events-none flex items-center justify-center"
          style={{
            transform: 'rotateX(58deg) rotateY(-18deg) rotateZ(35deg) translateZ(45px)',
          }}
        >
          <div className="relative w-full h-full rounded-[50%] animate-spin-slow">
            {/* Front cut of the glass disc with bright refractive edge */}
            <div className="absolute inset-0 rounded-[50%] border-b-[3px] border-r-[2.5px] border-white/90 shadow-[0_10px_30px_rgba(255,255,255,0.6)]" />
            
            {/* Orbiting Telemetry Indicator Node */}
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-white shadow-md backdrop-blur-md"
              style={{
                transform: 'rotateZ(-35deg) rotateY(18deg) rotateX(-58deg)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-status-teal animate-ping" />
              <span className="text-[9px] font-mono font-bold text-ink-primary">Verified Δ ±0.0 pp</span>
            </div>
          </div>
        </div>

        {/* Orbiting Satellite Data Bead 2 */}
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-[-10%] pointer-events-none flex items-center justify-center"
        >
          <div
            className="absolute top-0 right-1/4 w-7 h-7 rounded-full bg-white/90 border border-white/80 shadow-lg backdrop-blur-md flex items-center justify-center"
            style={{ transform: 'translateZ(60px)' }}
          >
            <Shield className="w-3.5 h-3.5 text-steel" />
          </div>
        </motion.div>
      </motion.div>

      {/* Floating Interactive Sub-Caption / Interaction Hint */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-border-line text-[10px] font-mono text-ink-muted backdrop-blur-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-steel animate-pulse" />
        <span>3D Refractive Optical Model • Hover to Tilt</span>
      </div>
    </div>
  );
}
