import React from 'react';

interface LogoProps {
  variant?: 'mark' | 'full' | 'compact';
  theme?: 'dark' | 'light';
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  theme = 'dark',
  size = 36,
  className = '',
}) => {
  const isDark = theme === 'dark';
  const strokeMain = isDark ? '#F5F2EA' : '#10261C';
  const strokeGold = '#B59A63';
  const strokeTies = isDark ? '#8E9A93' : '#68736D';

  const markSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="railoptima-logo-mark"
      style={{ flexShrink: 0 }}
      aria-label="RAILOPTIMA proprietary railway monogram"
    >
      {/* Left Main Running Rail */}
      <line x1="12" y1="6" x2="12" y2="42" stroke={strokeMain} strokeWidth="3" strokeLinecap="round" />
      
      {/* Right Turnout Running Rail */}
      <line x1="19" y1="6" x2="19" y2="42" stroke={strokeMain} strokeWidth="2.2" strokeLinecap="round" />

      {/* Precision Railway Cross-Ties (Sleepers) */}
      <line x1="8" y1="12" x2="23" y2="12" stroke={strokeTies} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      <line x1="8" y1="19" x2="23" y2="19" stroke={strokeTies} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      <line x1="8" y1="26" x2="23" y2="26" stroke={strokeTies} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      <line x1="8" y1="33" x2="23" y2="33" stroke={strokeTies} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      <line x1="8" y1="40" x2="23" y2="40" stroke={strokeTies} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />

      {/* R Upper Architectural Arc */}
      <path
        d="M 19 8.5 H 29 C 35.5 8.5 39.5 12.5 39.5 18 C 39.5 23.5 35.5 27.5 29 27.5 H 19"
        stroke={strokeMain}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 19 13.5 H 28 C 31.5 13.5 34.5 15.5 34.5 18 C 34.5 20.5 31.5 22.5 28 22.5 H 19"
        stroke={strokeGold}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* High-Speed Switch Turnout Leg (Forward Dynamic Divergence) */}
      <path d="M 26 26.5 L 39 41.5" stroke={strokeMain} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M 21.5 28 L 33 41.5" stroke={strokeGold} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );

  if (variant === 'mark') {
    return <div className={`brand-mark-wrapper ${className}`}>{markSvg}</div>;
  }

  return (
    <div
      className={`brand-container ${variant} ${theme} ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}
    >
      {markSvg}
      <div className="brand-text-block">
        <div
          className="brand-title"
          style={{
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: size >= 40 ? '16px' : '13.5px',
            fontWeight: 700,
            letterSpacing: '2.4px',
            lineHeight: 1.15,
            color: isDark ? '#F5F2EA' : '#10261C',
          }}
        >
          RAILOPTIMA
        </div>
        <div
          className="brand-subtitle"
          style={{
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: size >= 40 ? '8px' : '7.5px',
            fontWeight: 600,
            letterSpacing: '1.4px',
            marginTop: '3px',
            textTransform: 'uppercase',
            color: isDark ? '#A1ADA6' : '#68736D',
          }}
        >
          Operations Intelligence
        </div>
      </div>
    </div>
  );
};
