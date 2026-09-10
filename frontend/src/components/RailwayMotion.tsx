import React from 'react';

interface RailwayMotionProps {
  upPathId?: string;
  downPathId?: string;
  upPathD?: string;
  downReversePathD?: string;
}

export const UP_TRACK_PATH = 'M 30 75 L 140 75 C 200 75 250 70 310 70 L 490 70 C 530 70 580 80 710 80';
export const DOWN_TRACK_REVERSE_PATH = 'M 710 130 C 640 130 600 135 530 135 L 370 135 C 270 135 220 140 150 140 L 30 140';

/**
 * Ambient, deterministic railway movement simulation.
 * Minimal geometric train consists (engine + coupled wagon + direction chevron)
 * traversing UP and DOWN tracks at staggered speeds.
 * Purely visual ambient activity — does NOT alter backend state or schedules.
 */
export const RailwayMotion: React.FC<RailwayMotionProps> = ({
  upPathD = UP_TRACK_PATH,
  downReversePathD = DOWN_TRACK_REVERSE_PATH,
}) => {
  return (
    <g className="railway-motion-layer" aria-hidden="true">
      {/* ==========================================================
          TRAIN A: UP DIRECTION (Delhi Main -> Ghaziabad)
          Speed: 22s traversal, starts immediately
          ========================================================== */}
      <g className="simulated-train-marker train-up-primary">
        {/* Geometric Consist: Engine + Wagon */}
        <g transform="translate(-10, -3)">
          {/* Main Locomotive Body */}
          <rect x="0" y="0" width="11" height="6" rx="1.5" fill="#10261C" stroke="#B59A63" strokeWidth="1" />
          {/* Direction indicator nose */}
          <path d="M 11 1 L 13.5 3 L 11 5 Z" fill="#B59A63" />
          {/* Coupler link */}
          <line x1="-2" y1="3" x2="0" y2="3" stroke="#8E9A93" strokeWidth="1" />
          {/* Trailing Freight Wagon */}
          <rect x="-10" y="0.5" width="8" height="5" rx="1" fill="#1D3A2B" stroke="#68736D" strokeWidth="0.75" />
          {/* Minimal cab indicator */}
          <circle cx="9" cy="3" r="0.75" fill="#F5F2EA" />
        </g>
        <animateMotion
          path={upPathD}
          dur="22s"
          repeatCount="indefinite"
          rotate="auto"
          calcMode="linear"
        />
      </g>

      {/* ==========================================================
          TRAIN B: DOWN DIRECTION (Ghaziabad -> Delhi Main)
          Speed: 19s traversal, offset start
          ========================================================== */}
      <g className="simulated-train-marker train-down-primary">
        <g transform="translate(-10, -3)">
          {/* Locomotive Body */}
          <rect x="0" y="0" width="11" height="6" rx="1.5" fill="#10261C" stroke="#B59A63" strokeWidth="1" />
          <path d="M 11 1 L 13.5 3 L 11 5 Z" fill="#B59A63" />
          <line x1="-2" y1="3" x2="0" y2="3" stroke="#8E9A93" strokeWidth="1" />
          <rect x="-10" y="0.5" width="8" height="5" rx="1" fill="#1D3A2B" stroke="#68736D" strokeWidth="0.75" />
          <circle cx="9" cy="3" r="0.75" fill="#F5F2EA" />
        </g>
        <animateMotion
          path={downReversePathD}
          dur="19s"
          begin="-7s"
          repeatCount="indefinite"
          rotate="auto"
          calcMode="linear"
        />
      </g>

      {/* ==========================================================
          TRAIN C: UP DIRECTION SECONDARY (Trailing Corridor Block)
          Speed: 26s traversal, offset start
          ========================================================== */}
      <g className="simulated-train-marker train-up-secondary">
        <g transform="translate(-8, -2.5)">
          <rect x="0" y="0" width="9" height="5" rx="1" fill="#1D3A2B" stroke="#B59A63" strokeWidth="0.8" />
          <path d="M 9 1 L 11 2.5 L 9 4 Z" fill="#B59A63" />
          <line x1="-2" y1="2.5" x2="0" y2="2.5" stroke="#8E9A93" strokeWidth="0.8" />
          <rect x="-8" y="0.5" width="6.5" height="4" rx="0.75" fill="#10261C" stroke="#68736D" strokeWidth="0.6" />
        </g>
        <animateMotion
          path={upPathD}
          dur="26s"
          begin="-13s"
          repeatCount="indefinite"
          rotate="auto"
          calcMode="linear"
        />
      </g>
    </g>
  );
};
