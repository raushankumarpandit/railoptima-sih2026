import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface RouteTransitionProps {
  onComplete: () => void;
  userRole?: string;
  userName?: string;
}

interface SectionCheckpoint {
  id: string;
  label: string;
  station: string;
  x: number;
}

const SECTIONS: SectionCheckpoint[] = [
  { id: 'SEC-001', label: 'SEC-001', station: 'DELHI MAIN', x: 120 },
  { id: 'SEC-002', label: 'SEC-002', station: 'DELHI JN', x: 260 },
  { id: 'SEC-003', label: 'SEC-003', station: 'OLD YAMUNA', x: 400 },
  { id: 'SEC-004', label: 'SEC-004', station: 'DELHI SHAHDARA', x: 540 },
  { id: 'SEC-005', label: 'SEC-005', station: 'SAHIBABAD JN', x: 680 },
  { id: 'SEC-006', label: 'SEC-006', station: 'GHAZIABAD JN', x: 820 },
];

export const RouteTransition: React.FC<RouteTransitionProps> = ({
  onComplete,
  userRole = 'OPERATIONS PLANNER',
  userName = 'Operator',
}) => {
  const [phase, setPhase] = useState<number>(0);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(-1);

  useEffect(() => {
    // Respect accessibility preference: reduce motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const quickTimer = setTimeout(() => {
        onComplete();
      }, 100);
      return () => clearTimeout(quickTimer);
    }

    // Step 1: 150ms -> Line begins drawing
    const t1 = setTimeout(() => setPhase(1), 120);

    // Step 2: 300ms -> Train marker moves along the route
    const t2 = setTimeout(() => setPhase(2), 280);

    // Step 3: Sequential node illumination (400ms to 700ms)
    const tNodes = SECTIONS.map((_, i) =>
      setTimeout(() => {
        setActiveSectionIndex(i);
      }, 350 + i * 65)
    );

    // Step 4: 750ms -> Topology locked, route cleared
    const t3 = setTimeout(() => setPhase(3), 750);

    // Step 5: 920ms -> Handover to Network Overview
    const tFinal = setTimeout(() => {
      onComplete();
    }, 920);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFinal);
      tNodes.forEach((t) => clearTimeout(t));
    };
  }, [onComplete]);

  return (
    <div className="route-transition-overlay" role="dialog" aria-label="Route clearance into control room">
      <div className="route-transition-content">
        {/* Monogram and Sector Clearance Header */}
        <div className="transition-header">
          <div className="transition-brand">
            <Logo variant="mark" theme="dark" size={32} />
            <div className="transition-brand-copy">
              <span className="transition-brand-title">RAILOPTIMA</span>
              <span className="transition-brand-sub">OPERATIONS CONTROL SYSTEM</span>
            </div>
          </div>

          <div className="transition-auth-chip">
            <span className="auth-indicator-dot" />
            <span className="auth-role-text">{userRole.toUpperCase()}</span>
            <span className="auth-sep">/</span>
            <span className="auth-user-name">{userName}</span>
          </div>
        </div>

        {/* Tactical Corridor Clearance Schematic */}
        <div className="transition-schematic-stage">
          <div className="schematic-stage-eyebrow">
            <span className="eyebrow-tag">CORRIDOR CLEARANCE INITIALIZATION</span>
            <span className="eyebrow-route">NCR // DELHI–GHAZIABAD 130 KM/H CORRIDOR</span>
          </div>

          <svg
            viewBox="0 0 940 180"
            className="transition-svg-canvas"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Grid Lines for engineering blueprint feel */}
            <defs>
              <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1D3A2B" strokeWidth="0.75" opacity="0.4" />
              </pattern>
              {/* Linear gradient for leading train headlight beam */}
              <linearGradient id="train-beam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B59A63" stopOpacity="0" />
                <stop offset="100%" stopColor="#B59A63" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            <rect width="940" height="180" fill="url(#grid-pattern)" />

            {/* Base Corridor Track Guide */}
            <line
              x1="60"
              y1="90"
              x2="880"
              y2="90"
              stroke="#1D3A2B"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Primary Drawing Route Line (Animated via CSS stroke-dashoffset) */}
            <line
              x1="60"
              y1="90"
              x2="880"
              y2="90"
              className={`transition-route-line ${phase >= 1 ? 'is-drawing' : ''}`}
              stroke="#F5F2EA"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Parallel Switch Divergence Rail */}
            <path
              d="M 380 90 Q 460 55 540 55 L 760 55"
              className={`transition-turnout-line ${phase >= 1 ? 'is-drawing' : ''}`}
              stroke="#B59A63"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />

            {/* 6 Section Checkpoints */}
            {SECTIONS.map((sec, idx) => {
              const isCleared = activeSectionIndex >= idx;
              return (
                <g
                  key={sec.id}
                  className={`section-checkpoint-node ${isCleared ? 'is-cleared' : ''}`}
                  transform={`translate(${sec.x}, 90)`}
                >
                  {/* Vertical Station Tick Marker */}
                  <line
                    x1="0"
                    y1="-18"
                    x2="0"
                    y2="18"
                    stroke={isCleared ? '#B59A63' : '#1D3A2B'}
                    strokeWidth="1.5"
                  />

                  {/* Section Diamond Node */}
                  <circle
                    cx="0"
                    cy="0"
                    r={isCleared ? 5 : 3.5}
                    fill={isCleared ? '#10261C' : '#0B1B13'}
                    stroke={isCleared ? '#F5F2EA' : '#2D4B39'}
                    strokeWidth={isCleared ? 2.5 : 1.5}
                  />

                  {/* Station / Section Code */}
                  <text
                    x="0"
                    y="-28"
                    textAnchor="middle"
                    className="checkpoint-code-text"
                    fill={isCleared ? '#F5F2EA' : '#68736D'}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fontWeight="700"
                  >
                    {sec.label}
                  </text>

                  {/* Station Name */}
                  <text
                    x="0"
                    y="36"
                    textAnchor="middle"
                    className="checkpoint-station-text"
                    fill={isCleared ? '#B59A63' : '#3E5448'}
                    fontFamily="Inter, sans-serif"
                    fontSize="8.5"
                    letterSpacing="1"
                    fontWeight="600"
                  >
                    {sec.station}
                  </text>

                  {/* Clearance Tag */}
                  {isCleared && (
                    <text
                      x="0"
                      y="48"
                      textAnchor="middle"
                      fill="#2D6A4F"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="7.5"
                      fontWeight="700"
                    >
                      CLEAR
                    </text>
                  )}
                </g>
              );
            })}

            {/* Small Geometric Consist (Moving train marker) */}
            {phase >= 2 && (
              <g className="transition-train-consist">
                {/* Headlight beam */}
                <polygon points="0,-4 32,-10 32,10 0,4" fill="url(#train-beam)" />
                {/* Locomotive Body */}
                <rect x="-18" y="-5" width="20" height="10" rx="2" fill="#F5F2EA" />
                {/* Cab window */}
                <rect x="-8" y="-3.5" width="5" height="7" rx="1" fill="#10261C" />
                {/* Coupler */}
                <line x1="-18" y1="0" x2="-22" y2="0" stroke="#B59A63" strokeWidth="2" />
                {/* Wagon / Inspection Car */}
                <rect x="-38" y="-5" width="16" height="10" rx="1.5" fill="#B59A63" />
                {/* Direction Chevron */}
                <path d="M -1 0 L -4 -2 L -4 2 Z" fill="#10261C" />
              </g>
            )}
          </svg>

          {/* Real-time Status Footer within Transition */}
          <div className="transition-status-band">
            <div className="transition-status-left">
              <span className="status-terminal-pulse" />
              <span className="status-terminal-text">
                {phase < 2
                  ? 'COMMENCING ROUTE SURVEY...'
                  : activeSectionIndex < 5
                  ? `CLEARING SECTOR ${SECTIONS[Math.max(0, activeSectionIndex)]?.label}...`
                  : 'CORRIDOR INTERLOCKING CONFIRMED — OPENING CONSOLE'}
              </span>
            </div>

            <div className="transition-status-right">
              <span className="status-spec-label">ROUTE IDENTITY</span>
              <span className="status-spec-value font-mono">NR-NCR-DLI-GZB-06</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
