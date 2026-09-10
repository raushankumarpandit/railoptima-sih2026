import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  BarChart2,
} from 'lucide-react';
import { api, canonicalSections, sectionDetails } from '../api';
import { Recommendation } from '../types';

interface PlannerProps {
  initialSection?: string;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const SEARCH_PHASES = [
  'EVALUATING ASSET CONDITION & FAILURE RISKS',
  'CHECKING CORRIDOR TRAFFIC OPERATING PRESSURE',
  'RANKING CANDIDATE POSSESSION WINDOWS',
  'CALCULATING CORRIDOR DISRUPTION MINIMIZATION',
];

export const Planner: React.FC<PlannerProps> = ({ initialSection = 'SEC-001', onToast }) => {
  const [section, setSection] = useState(initialSection);
  const [maintType, setMaintType] = useState('Inspection');
  const [date, setDate] = useState('2026-08-01');
  const [duration, setDuration] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPhaseIndex, setSearchPhaseIndex] = useState(0);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [deciding, setDeciding] = useState(false);

  // Cycle search phases while loading
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setSearchPhaseIndex((prev) => (prev + 1) % SEARCH_PHASES.length);
      }, 420);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const maintenanceTypes = [
    'Inspection',
    'PREVENTIVE',
    'CORRECTIVE',
    'EMERGENCY',
    'Rail Grinding',
    'Replacement',
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setSearchPhaseIndex(0);
    setErrorMessage('');
    setRecommendation(null);

    try {
      const res = await api<Recommendation>('/schedule/recommend', {
        method: 'POST',
        body: JSON.stringify({
          track_section: section,
          maintenance_type: maintType,
          duration_hours: duration,
          requested_date: date,
        }),
      });
      setRecommendation(res);
      onToast('Optimal maintenance block computed successfully', 'success');
    } catch (err: any) {
      setErrorMessage('Could not reach the RAILOPTIMA API. Confirm FastAPI is running at http://localhost:8000.');
      onToast('Unable to calculate block window. Check backend connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (action: 'approve' | 'reject') => {
    if (!recommendation) return;
    setDeciding(true);
    try {
      const res = await api<Recommendation>(`/schedule/${recommendation.id}/${action}`, {
        method: 'POST',
      });
      setRecommendation(res);
      onToast(
        action === 'approve'
          ? `Block #${res.id} Approved: Window authorized by human planner`
          : `Block #${res.id} Rejected: Window released for schedule replanning`,
        action === 'approve' ? 'success' : 'info'
      );
    } catch (err: any) {
      onToast(`Failed to ${action} block. Role must be planner or admin.`, 'error');
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div className="planner-editorial-workspace">
      {/* 4-STAGE PIPELINE: ROUTE PROGRESSION WITH THIN CONNECTING LINE */}
      <section className="planner-pipeline-rail-track" aria-label="Optimization Decision Pipeline">
        <div className="pipeline-header-row">
          <span className="pipeline-tag font-mono">AUTOMATED WINDOW OPTIMIZATION</span>
          <span className="pipeline-sep">/</span>
          <span className="pipeline-sub font-mono">MULTI-CRITERIA DECISION PIPELINE</span>
        </div>

        <div className="pipeline-track-diagram">
          {/* Thin continuous railway connecting line */}
          <div className="pipeline-connecting-spine" />

          <div className={`pipeline-stage-node ${isLoading && searchPhaseIndex === 0 ? 'is-active' : ''}`}>
            <div className="stage-node-bullet">
              <span className="node-num font-mono">01</span>
            </div>
            <div className="stage-node-meta">
              <span className="node-title font-mono">ASSET RISK</span>
              <span className="node-desc">Degradation & urgency</span>
            </div>
          </div>

          <div className={`pipeline-stage-node ${isLoading && searchPhaseIndex === 1 ? 'is-active' : ''}`}>
            <div className="stage-node-bullet">
              <span className="node-num font-mono">02</span>
            </div>
            <div className="stage-node-meta">
              <span className="node-title font-mono">TRAFFIC</span>
              <span className="node-desc">Goods operating density</span>
            </div>
          </div>

          <div className={`pipeline-stage-node ${isLoading && searchPhaseIndex === 2 ? 'is-active' : ''}`}>
            <div className="stage-node-bullet">
              <span className="node-num font-mono">03</span>
            </div>
            <div className="stage-node-meta">
              <span className="node-title font-mono">OPTIMIZE</span>
              <span className="node-desc">Multi-slot search</span>
            </div>
          </div>

          <div className={`pipeline-stage-node stage-terminal ${isLoading && searchPhaseIndex === 3 ? 'is-active' : ''}`}>
            <div className="stage-node-bullet terminal-bullet">
              <span className="node-num font-mono">04</span>
            </div>
            <div className="stage-node-meta">
              <span className="node-title font-mono">RECOMMEND</span>
              <span className="node-desc">Human sign-off</span>
            </div>
          </div>
        </div>
      </section>

      {/* PLANNER WORKBENCH: OPEN CANVAS INPUTS ON LEFT, DECISION DOCUMENT ON RIGHT */}
      <div className="planner-workbench-grid">
        {/* INPUTS CANVAS (OPEN WORKBENCH, UNDERLINE STYLE) */}
        <section className="planner-workbench-column">
          <div className="workbench-column-header">
            <span className="column-label font-mono">CORRIDOR CONSTRAINTS & PARAMETERS</span>
            <h2 className="column-heading">Possession Search Inputs</h2>
          </div>

          <form onSubmit={handleGenerate} className="workbench-form">
            {errorMessage && (
              <div className="workbench-error-banner font-mono">
                {errorMessage}
              </div>
            )}

            <div className="workbench-field-group">
              <label htmlFor="planner-section" className="workbench-field-label font-mono">
                CORRIDOR TRACK SECTION
              </label>
              <select
                id="planner-section"
                className="workbench-select-field font-mono"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                {canonicalSections.map((secId) => {
                  const details = sectionDetails[secId];
                  return (
                    <option key={secId} value={secId}>
                      {secId}: {details ? details.name : secId}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="workbench-field-group">
              <label htmlFor="planner-type" className="workbench-field-label font-mono">
                MAINTENANCE CLASSIFICATION
              </label>
              <select
                id="planner-type"
                className="workbench-select-field font-mono"
                value={maintType}
                onChange={(e) => setMaintType(e.target.value)}
              >
                {maintenanceTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="workbench-field-dual-row">
              <div className="workbench-field-group">
                <label htmlFor="planner-date" className="workbench-field-label font-mono">
                  SCHEDULED DATE
                </label>
                <input
                  id="planner-date"
                  type="date"
                  className="workbench-input-field font-mono"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="workbench-field-group">
                <label htmlFor="planner-duration" className="workbench-field-label font-mono">
                  POSSESSION DURATION
                </label>
                <select
                  id="planner-duration"
                  className="workbench-select-field font-mono"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6].map((hrs) => (
                    <option key={hrs} value={hrs}>
                      {hrs} {hrs === 1 ? 'Hour' : 'Hours'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="workbench-submit-cta"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={15} className="spin-icon" />
                  <span className="font-mono">{SEARCH_PHASES[searchPhaseIndex]}</span>
                </>
              ) : (
                <>
                  <span>GENERATE OPTIMAL BLOCK</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>

            <div className="workbench-guarantee-note font-mono">
              <ShieldCheck size={14} className="note-icon" />
              <span>Multi-criteria search evaluates asset failure probability, goods traffic density, and estimated route disruption.</span>
            </div>
          </form>
        </section>

        {/* DECISION DOCUMENT (OPERATIONAL DECISION SPECIFICATION) */}
        <section className="planner-document-column">
          {recommendation ? (
            <div className="decision-operational-document">
              {/* Document Header */}
              <div className="doc-header-block">
                <div className="doc-eyebrow font-mono">
                  <span>RECOMMENDED POSSESSION WINDOW</span>
                  <span className="doc-bullet">/</span>
                  <span className="doc-section font-mono">{recommendation.track_section}</span>
                  <span className="doc-bullet">/</span>
                  <span className="doc-type">{recommendation.maintenance_type.toUpperCase()}</span>
                </div>

                <div className="doc-window-display font-mono">
                  {recommendation.recommended_window}
                </div>

                <div className="doc-sector-details">
                  Possession span: <strong>{recommendation.duration_hours} hours</strong> • Sector: {sectionDetails[recommendation.track_section]?.name || recommendation.track_section} • Confidence: <strong className="font-mono">{Math.round(recommendation.confidence_pct)}%</strong>
                </div>
              </div>

              {/* Strong Horizontal Metric Line with Hairline Dividers */}
              <div className="doc-metric-line" aria-label="Recommendation Core Metrics">
                <div className="doc-metric-cell">
                  <div className="doc-metric-val font-mono">{Math.round(recommendation.urgency_score)}/100</div>
                  <div className="doc-metric-label font-mono">ASSET URGENCY</div>
                </div>

                <div className="doc-metric-div" />

                <div className="doc-metric-cell">
                  <div className="doc-metric-val font-mono">{Math.round(recommendation.failure_probability * 100)}%</div>
                  <div className="doc-metric-label font-mono">FAILURE PROB</div>
                </div>

                <div className="doc-metric-div" />

                <div className="doc-metric-cell">
                  <div className="doc-metric-val font-mono">{recommendation.predicted_traffic.toFixed(1)} <span className="doc-unit">tr/hr</span></div>
                  <div className="doc-metric-label font-mono">TRAFFIC DENSITY</div>
                </div>

                <div className="doc-metric-div" />

                <div className="doc-metric-cell">
                  <div className="doc-metric-val font-mono">{Math.round(recommendation.disruption_minutes)} <span className="doc-unit">min</span></div>
                  <div className="doc-metric-label font-mono">EST. DISRUPTION</div>
                </div>

                <div className="doc-metric-div" />

                <div className="doc-metric-cell cell-highlight">
                  <div className="doc-metric-val font-mono val-gold">{Math.round(recommendation.delay_reduction_pct)}%</div>
                  <div className="doc-metric-label font-mono">DELAY REDUCTION</div>
                </div>
              </div>

              {/* "WHY THIS SLOT?" DOMINANT STRUCTURED EVIDENCE */}
              <div className="doc-rationale-section">
                <div className="doc-rationale-title font-mono">
                  <ShieldCheck size={16} />
                  <span>WHY THIS SLOT?</span>
                </div>

                <div className="doc-evidence-grid">
                  <div className="evidence-grid-row">
                    <span className="evidence-key font-mono">1. ASSET RISK:</span>
                    <span className="evidence-desc">
                      Urgency score {Math.round(recommendation.urgency_score)}/100 mandates planned possession prior to mechanical failure.
                    </span>
                  </div>
                  <div className="evidence-grid-row">
                    <span className="evidence-key font-mono">2. TRAFFIC DENSITY:</span>
                    <span className="evidence-desc">
                      Window coincides with corridor valley ({recommendation.predicted_traffic.toFixed(1)} trains/hr, {recommendation.traffic_level} category).
                    </span>
                  </div>
                  <div className="evidence-grid-row">
                    <span className="evidence-key font-mono">3. DISRUPTION COST:</span>
                    <span className="evidence-desc">
                      Restricts estimated network delay to {Math.round(recommendation.disruption_minutes)} min (+{Math.round(recommendation.delay_reduction_pct)}% throughput advantage vs peak).
                    </span>
                  </div>
                </div>

                <p className="doc-narrative-p">{recommendation.explanation}</p>
              </div>

              {/* PLANNER DECISION — HUMAN AUTHORIZATION BAR */}
              <div className="doc-authorization-bar">
                <div className="auth-status-indicator">
                  <span className="auth-bar-label font-mono">PLANNER SIGN-OFF:</span>
                  <span className={`auth-badge-status status-${recommendation.status.toLowerCase()} font-mono`}>
                    {recommendation.status}
                  </span>
                </div>

                {recommendation.status === 'PENDING' ? (
                  <div className="auth-actions-row">
                    <button
                      type="button"
                      className="auth-reject-btn font-mono"
                      onClick={() => handleDecision('reject')}
                      disabled={deciding}
                    >
                      <XCircle size={15} />
                      <span>REJECT</span>
                    </button>
                    <button
                      type="button"
                      className="auth-approve-btn font-mono"
                      onClick={() => handleDecision('approve')}
                      disabled={deciding}
                    >
                      <CheckCircle2 size={16} />
                      <span>APPROVE BLOCK</span>
                    </button>
                  </div>
                ) : (
                  <div className="auth-settled-text font-mono">
                    {recommendation.status === 'APPROVED' ? (
                      <span className="auth-approved-tag">✓ BLOCK RESERVED IN CORRIDOR WORKING TIMETABLE</span>
                    ) : (
                      <span className="auth-rejected-tag">✕ WINDOW REJECTED BY PLANNER — RELEASED FOR REPLANNING</span>
                    )}
                  </div>
                )}
              </div>

              {/* RANKED ALTERNATIVES LEDGER */}
              <div className="doc-alternatives-ledger">
                <div className="ledger-header-line font-mono">
                  <span>RANKED CANDIDATE ALTERNATIVES</span>
                  <span className="ledger-tag">DETERMINISTIC EVALUATION</span>
                </div>

                <div className="ledger-table-wrap">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        <th>RANK</th>
                        <th>TIME WINDOW</th>
                        <th>DENSITY</th>
                        <th>TRAFFIC</th>
                        <th>DISRUPTION</th>
                        <th>PRIORITY</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="ledger-row-winner">
                        <td className="font-mono font-gold">#1 OPTIMAL</td>
                        <td className="font-mono font-gold font-bold">{recommendation.recommended_window}</td>
                        <td>
                          <span className="ledger-density-pill density-low font-mono">
                            {recommendation.traffic_level}
                          </span>
                        </td>
                        <td className="font-mono">{recommendation.predicted_traffic.toFixed(1)} tr</td>
                        <td className="font-mono">{Math.round(recommendation.disruption_minutes)} min</td>
                        <td className="font-mono font-gold">100</td>
                      </tr>

                      {recommendation.alternatives && recommendation.alternatives.length > 0 ? (
                        recommendation.alternatives.slice(0, 4).map((alt, idx) => (
                          <tr key={idx} className="ledger-row-alt">
                            <td className="font-mono">#{idx + 2}</td>
                            <td className="font-mono">{alt.window}</td>
                            <td>
                              <span className={`ledger-density-pill density-${alt.traffic_level.toLowerCase()} font-mono`}>
                                {alt.traffic_level}
                              </span>
                            </td>
                            <td className="font-mono">{alt.predicted_traffic.toFixed(1)} tr</td>
                            <td className="font-mono">{Math.round(alt.disruption_minutes)} min</td>
                            <td className="font-mono">{Math.round(alt.priority_score)}</td>
                          </tr>
                        ))
                      ) : null}
                    </tbody>
                  </table>
                </div>

                {/* FEATURE IMPORTANCE BARS */}
                {recommendation.feature_importance_pct && Object.keys(recommendation.feature_importance_pct).length > 0 && (
                  <div className="doc-feature-weights">
                    <div className="feature-weight-title font-mono">
                      <BarChart2 size={13} />
                      <span>MODEL INFLUENCE WEIGHTS</span>
                    </div>
                    <div className="feature-weight-grid">
                      {Object.entries(recommendation.feature_importance_pct)
                        .slice(0, 6)
                        .map(([feature, weight]) => {
                          const formattedName = feature.replace(/_/g, ' ');
                          const numWeight = Number(weight) || 0;
                          return (
                            <div key={feature} className="feature-item-row">
                              <span className="feature-label-text">{formattedName}</span>
                              <div className="feature-bar-rail">
                                <div
                                  className="feature-bar-fill"
                                  style={{ width: `${Math.min(100, numWeight * 2.2)}%` }}
                                />
                              </div>
                              <span className="feature-val-text font-mono">{numWeight.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* EMPTY WORKBENCH SPECIFICATION STATE */
            <div className="workbench-awaiting-canvas">
              <div className="awaiting-canvas-inner">
                <CalendarClock size={36} className="awaiting-hero-icon" />
                <h3 className="awaiting-title font-mono">OPERATIONAL DECISION SPECIFICATION</h3>
                <p className="awaiting-narrative">
                  Select corridor section, classification, date, and duration on the left, then click <strong>GENERATE OPTIMAL BLOCK</strong>. The decision engine will calculate multi-criteria candidate windows and present the authorized recommendation document.
                </p>

                <div className="awaiting-pipeline-preview font-mono">
                  <div className="preview-stage-col">
                    <span className="preview-stage-num">01</span>
                    <span className="preview-stage-name">ASSET RISK</span>
                    <span className="preview-stage-sub">Degradation & urgency</span>
                  </div>
                  <div className="preview-stage-div">→</div>
                  <div className="preview-stage-col">
                    <span className="preview-stage-num">02</span>
                    <span className="preview-stage-name">TRAFFIC</span>
                    <span className="preview-stage-sub">24h Goods density</span>
                  </div>
                  <div className="preview-stage-div">→</div>
                  <div className="preview-stage-col">
                    <span className="preview-stage-num">03</span>
                    <span className="preview-stage-name">OPTIMIZE</span>
                    <span className="preview-stage-sub">Delay minimization</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
