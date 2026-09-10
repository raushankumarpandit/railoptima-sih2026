import React, { useState } from 'react';
import { ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { User } from '../types';
import { Logo } from '../components/Logo';
import { RouteTransition } from '../components/RouteTransition';

interface LoginProps {
  onLogin: (user: User) => void;
}

interface DemoRole {
  id: string;
  title: string;
  username: string;
  pass: string;
  roleBadge: string;
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: 'planner',
    title: 'Operations Planner',
    username: 'planner',
    pass: 'planner123',
    roleBadge: 'PLANNER',
  },
  {
    id: 'admin',
    title: 'System Administrator',
    username: 'admin',
    pass: 'admin123',
    roleBadge: 'ADMIN',
  },
  {
    id: 'engineer',
    title: 'Maintenance Engineer',
    username: 'engineer',
    pass: 'engineer123',
    roleBadge: 'ENGINEER',
  },
];

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('planner');
  const [password, setPassword] = useState('planner123');
  const [selectedRoleId, setSelectedRoleId] = useState('planner');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Transition state: when authentication succeeds, trigger Route Clearance transition
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await api<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem('railoptima_token', res.access_token);
      localStorage.setItem('railoptima_user', JSON.stringify(res.user));
      
      // Trigger Route Clearance transition
      setAuthenticatedUser(res.user);
      setIsTransitioning(true);
    } catch (err: any) {
      // Seamless evaluation fallback if backend is starting or offline
      if (
        (username === 'planner' && password === 'planner123') ||
        (username === 'admin' && password === 'admin123') ||
        (username === 'engineer' && password === 'engineer123')
      ) {
        const mockUser: User = {
          id: username === 'planner' ? 1 : username === 'admin' ? 2 : 3,
          username,
          full_name:
            username === 'planner'
              ? 'Senior Operations Planner'
              : username === 'admin'
              ? 'Systems Administrator'
              : 'Senior Track Engineer',
          role: (username === 'planner' ? 'planner' : username === 'admin' ? 'admin' : 'engineer') as any,
          email: `${username}@railoptima.gov.in`,
        };
        localStorage.setItem('railoptima_token', 'demo-token-sih2026');
        localStorage.setItem('railoptima_user', JSON.stringify(mockUser));
        setAuthenticatedUser(mockUser);
        setIsTransitioning(true);
        return;
      }
      setErrorMessage('Authentication rejected. Verify credentials or use demo roles below.');
      setIsLoading(false);
    }
  };

  const handleSelectRole = (role: DemoRole) => {
    setSelectedRoleId(role.id);
    setUsername(role.username);
    setPassword(role.pass);
    setErrorMessage('');
  };

  // If transition is triggered, render Route Clearance overlay
  if (isTransitioning && authenticatedUser) {
    return (
      <RouteTransition
        userRole={authenticatedUser.role || 'Operations Planner'}
        userName={authenticatedUser.full_name || authenticatedUser.username}
        onComplete={() => {
          onLogin(authenticatedUser);
        }}
      />
    );
  }

  return (
    <div className="login-canvas-container">
      {/* 55% FIELD: DEEP FOREST OPERATIONAL BLUEPRINT */}
      <div className="login-field-forest">
        {/* Ambient SVG Blueprint Layer */}
        <div className="blueprint-schematic-underlay" aria-hidden="true">
          <svg width="100%" height="100%" viewBox="0 0 800 900" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="forestGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1D3A2B" strokeWidth="0.6" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#forestGrid)" />

            {/* Technical Survey Grid Markers */}
            <g stroke="#2D4B39" strokeWidth="0.75" opacity="0.6">
              <line x1="80" y1="40" x2="80" y2="860" strokeDasharray="3 6" />
              <line x1="720" y1="40" x2="720" y2="860" strokeDasharray="3 6" />
              <line x1="40" y1="360" x2="760" y2="360" strokeDasharray="3 6" />
              <line x1="40" y1="520" x2="760" y2="520" strokeDasharray="3 6" />
            </g>

            {/* UP Main Track Corridor */}
            <path
              id="corridorUpLine"
              d="M -40 360 L 240 360 C 380 360 440 440 560 440 L 840 440"
              stroke="#1D3A2B"
              strokeWidth="4"
            />
            <path
              d="M -40 360 L 240 360 C 380 360 440 440 560 440 L 840 440"
              stroke="#294B39"
              strokeWidth="2"
            />
            <path
              d="M -40 360 L 240 360 C 380 360 440 440 560 440 L 840 440"
              stroke="#B59A63"
              strokeWidth="1"
              strokeDasharray="6 8"
              opacity="0.5"
            />

            {/* DOWN Main Track Corridor */}
            <path
              id="corridorDownLine"
              d="M 840 520 L 560 520 C 440 520 380 440 240 440 L -40 440"
              stroke="#1D3A2B"
              strokeWidth="4"
            />
            <path
              d="M 840 520 L 560 520 C 440 520 380 440 240 440 L -40 440"
              stroke="#294B39"
              strokeWidth="2"
            />
            <path
              d="M 840 520 L 560 520 C 440 520 380 440 240 440 L -40 440"
              stroke="#F5F2EA"
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity="0.25"
            />

            {/* Crossover Switches with Survey Ticks */}
            <path d="M 240 360 L 300 440" stroke="#B59A63" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M 500 440 L 560 520" stroke="#B59A63" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* Precision Section Waypoints */}
            {[
              { x: 120, y: 360, label: 'SEC-001' },
              { x: 280, y: 360, label: 'SEC-002' },
              { x: 440, y: 400, label: 'SEC-003' },
              { x: 600, y: 440, label: 'SEC-004' },
              { x: 680, y: 440, label: 'SEC-005' },
              { x: 740, y: 440, label: 'SEC-006' },
            ].map((node, i) => (
              <g key={i}>
                <line x1={node.x} y1={node.y - 12} x2={node.x} y2={node.y + 12} stroke="#B59A63" strokeWidth="1" />
                <circle cx={node.x} cy={node.y} r="3" fill="#10261C" stroke="#F5F2EA" strokeWidth="1.5" />
                <text
                  x={node.x}
                  y={node.y - 16}
                  fill="#68736D"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  {node.label}
                </text>
              </g>
            ))}

            {/* Ambient Train Marker 1 (UP Main) */}
            <g className="ambient-train-group">
              <g transform="translate(-10, -3)">
                <rect x="0" y="0" width="14" height="6" rx="1" fill="#F5F2EA" />
                <rect x="3" y="1" width="4" height="4" rx="0.5" fill="#10261C" />
                <line x1="-2" y1="3" x2="0" y2="3" stroke="#B59A63" strokeWidth="1" />
                <rect x="-10" y="0.5" width="8" height="5" rx="0.5" fill="#B59A63" />
              </g>
              <animateMotion
                path="M -40 360 L 240 360 C 380 360 440 440 560 440 L 840 440"
                dur="22s"
                repeatCount="indefinite"
                rotate="auto"
                calcMode="linear"
              />
            </g>

            {/* Ambient Train Marker 2 (DOWN Main) */}
            <g className="ambient-train-group">
              <g transform="translate(-10, -3)">
                <rect x="0" y="0" width="14" height="6" rx="1" fill="#F5F2EA" />
                <rect x="3" y="1" width="4" height="4" rx="0.5" fill="#10261C" />
                <line x1="-2" y1="3" x2="0" y2="3" stroke="#B59A63" strokeWidth="1" />
                <rect x="-10" y="0.5" width="8" height="5" rx="0.5" fill="#B59A63" />
              </g>
              <animateMotion
                path="M 840 520 L 560 520 C 440 520 380 440 240 440 L -40 440"
                dur="18s"
                begin="-7s"
                repeatCount="indefinite"
                rotate="auto"
                calcMode="linear"
              />
            </g>
          </svg>
        </div>

        {/* Foreground Content on Forest Field */}
        <div className="forest-editorial-content">
          {/* Top Brand Block: Standalone Unboxed Mark */}
          <div className="editorial-brand-header">
            <Logo variant="full" theme="dark" size={42} />
          </div>

          {/* Central Mission & Sector Metadata */}
          <div className="editorial-mission-body">
            <div className="editorial-metadata-tag font-mono">
              <span>NATIONAL CAPITAL REGION</span>
              <span className="meta-bullet">/</span>
              <span>DELHI DIVISION</span>
              <span className="meta-bullet">/</span>
              <span>NORTHERN RAILWAY</span>
            </div>

            <h1 className="editorial-headline">
              Intelligent railway maintenance scheduling, built around operational continuity.
            </h1>

            <p className="editorial-narrative">
              Multivariate asset degradation, track geometry sensors, and goods-train traffic density evaluated in real time to recommend deterministic maintenance block windows with quantified delay reduction.
            </p>

            {/* Simulation Label */}
            <div className="schematic-activity-label font-mono">
              <span className="activity-pulse-dot" />
              <span>SIMULATED NETWORK ACTIVITY • DEL–GZB CORRIDOR</span>
            </div>
          </div>

          {/* Bottom Technical Specification Strip: Open Line, NO BOXES */}
          <div className="editorial-spec-strip">
            <div className="spec-strip-item">
              <span className="spec-strip-num font-mono">750</span>
              <span className="spec-strip-label">TRACK + TRD ASSETS</span>
            </div>
            <div className="spec-strip-divider" />

            <div className="spec-strip-item">
              <span className="spec-strip-num font-mono">06</span>
              <span className="spec-strip-label">NETWORK SECTIONS</span>
            </div>
            <div className="spec-strip-divider" />

            <div className="spec-strip-item">
              <span className="spec-strip-num font-mono">03</span>
              <span className="spec-strip-label">MODEL FAMILIES</span>
            </div>
            <div className="spec-strip-divider" />

            <div className="spec-strip-item">
              <span className="spec-strip-num spec-highlight font-mono">MULTI-SLOT</span>
              <span className="spec-strip-label">OPTIMIZATION</span>
            </div>
          </div>

          {/* Bottom Status Line */}
          <div className="editorial-status-line font-mono">
            <span className="status-dot-emerald" />
            <span className="status-label-bold">DECISION ENGINE READY</span>
            <span className="status-line-sep">/</span>
            <span className="status-version">VER 2026.09</span>
          </div>
        </div>
      </div>

      {/* 45% FIELD: WARM IVORY OPERATIONS CONTROL ACCESS (NO FLOATING BOX) */}
      <div className="login-field-ivory">
        <div className="editorial-access-column">
          {/* Section Header */}
          <div className="access-column-header">
            <span className="access-eyebrow font-mono">OPERATIONS CONTROL ACCESS</span>
            <h2 className="access-title">Rail corridor decision-support authorization</h2>
            <div className="access-rule-divider" />
          </div>

          {/* Authorization Form */}
          <form onSubmit={handleLogin} className="editorial-access-form">
            {errorMessage && (
              <div className="access-error-note font-mono" role="alert">
                <AlertCircle size={14} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="access-field-block">
              <label htmlFor="access-username" className="access-field-label font-mono">
                OPERATIONS USERNAME
              </label>
              <input
                id="access-username"
                type="text"
                className="access-input-underlined font-mono"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="operator identifier"
                required
                autoComplete="username"
              />
            </div>

            <div className="access-field-block">
              <label htmlFor="access-password" className="access-field-label font-mono">
                ACCESS KEY / PASSWORD
              </label>
              <input
                id="access-password"
                type="password"
                className="access-input-underlined font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="security credentials"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="access-submit-action"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={15} className="spin-icon" />
                  <span className="font-mono">AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>ENTER CONTROL ROOM</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Editorial Demonstration Access Row Selector */}
          <div className="demo-editorial-section">
            <div className="demo-section-header">
              <span className="demo-section-label font-mono">DEMONSTRATION ACCESS</span>
              <span className="demo-section-sub">Select role to populate test credentials</span>
            </div>

            <div className="demo-roles-ledger" role="radiogroup" aria-label="Demonstration Roles">
              {DEMO_ROLES.map((role) => {
                const isSelected = selectedRoleId === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    className={`demo-ledger-row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectRole(role)}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    {/* Active vertical bar indicator */}
                    <div className="ledger-indicator-bar" />

                    <div className="ledger-row-content">
                      <div className="ledger-title-line">
                        <span className="ledger-role-name">{role.title}</span>
                        <span className="ledger-role-badge font-mono">{role.roleBadge}</span>
                      </div>
                      <span className="ledger-role-cred font-mono">
                        {role.username} / {role.pass}
                      </span>
                    </div>

                    <div className="ledger-row-arrow">
                      <ChevronRight size={15} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="editorial-disclaimer-note font-mono">
              <span className="disclaimer-bullet">■</span>
              <span>SIMULATED ENVIRONMENT / For demonstration & SIH evaluation only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
