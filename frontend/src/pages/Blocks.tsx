import React, { useState, useEffect } from 'react';
import { ShieldCheck, CalendarClock, CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { api, sectionDetails } from '../api';
import { Recommendation } from '../types';
import { EmptyState, PageHeader } from '../components/UI';
import { PageId } from '../components/Sidebar';

interface BlocksProps {
  onNavigate: (page: PageId) => void;
}

export const Blocks: React.FC<BlocksProps> = ({ onNavigate }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api<Recommendation[]>('/schedule/recommendations')
      .then((res) => {
        setRecommendations(res || []);
      })
      .catch(() => {
        setRecommendations([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filtered = filterStatus === 'ALL'
    ? recommendations
    : recommendations.filter((r) => r.status.toUpperCase() === filterStatus.toUpperCase());

  return (
    <div className="blocks-audit-workspace">
      <PageHeader
        eyebrow="OPERATIONAL AUDIT TRAIL"
        title="Block Decisions & Schedulings Ledger"
        description="Chronological audit trail of AI-optimized track possession recommendations, planner authorizations, and executed corridor maintenance blocks."
      />

      {/* Filter Tabs — Editorial Style */}
      <div className="audit-filter-bar">
        <div className="audit-filter-tabs">
          {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'COMPLETED'].map((st) => (
            <button
              key={st}
              type="button"
              className={`audit-tab-item ${filterStatus === st ? 'is-active' : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              <span>{st}</span>
              <span className="audit-tab-count font-mono">
                {st === 'ALL'
                  ? recommendations.length
                  : recommendations.filter((r) => r.status.toUpperCase() === st).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CHRONOLOGICAL AUDIT LEDGER WITH VERTICAL SPINE */}
      {filtered.length > 0 ? (
        <div className="audit-chronology-container">
          {/* Central Vertical Spine Line */}
          <div className="audit-chronology-spine" />

          <div className="audit-milestones-list">
            {filtered.map((item, idx) => {
              const statusUpper = item.status.toUpperCase();
              let statusClass = 'status-pending';
              let StatusIcon = AlertCircle;

              if (statusUpper === 'APPROVED') {
                statusClass = 'status-approved';
                StatusIcon = CheckCircle2;
              } else if (statusUpper === 'REJECTED') {
                statusClass = 'status-rejected';
                StatusIcon = XCircle;
              } else if (statusUpper === 'COMPLETED') {
                statusClass = 'status-completed';
                StatusIcon = ShieldCheck;
              }

              return (
                <div key={item.id} className={`audit-milestone-entry ${statusClass}`}>
                  {/* Spine Node Dot */}
                  <div className="milestone-spine-node">
                    <div className="spine-node-dot" />
                  </div>

                  {/* Left Metadata Column */}
                  <div className="milestone-meta-column">
                    <div className="milestone-block-id font-mono">
                      BLOCK #{item.id}
                    </div>
                    <div className="milestone-time-window font-mono">
                      {item.recommended_window}
                    </div>
                    <div className="milestone-date-str font-mono">
                      {item.requested_date} ({item.duration_hours}h)
                    </div>
                    <div className={`milestone-status-chip ${statusClass} font-mono`}>
                      <StatusIcon size={11} />
                      <span>{statusUpper}</span>
                    </div>
                  </div>

                  {/* Right Detail Content */}
                  <div className="milestone-detail-column">
                    <div className="milestone-sector-header">
                      <span className="milestone-section-code font-mono">{item.track_section}</span>
                      <span className="milestone-sep">/</span>
                      <span className="milestone-section-name">
                        {sectionDetails[item.track_section]?.name || item.track_section}
                      </span>
                      <span className="milestone-type-pill font-mono">{item.maintenance_type}</span>
                    </div>

                    <div className="milestone-telemetry-strip font-mono">
                      <span>Urgency: <strong>{Math.round(item.urgency_score)}/100</strong></span>
                      <span className="telemetry-sep">|</span>
                      <span>Traffic: <strong>{item.predicted_traffic.toFixed(1)} tr/hr</strong></span>
                      <span className="telemetry-sep">|</span>
                      <span>Disruption: <strong>{Math.round(item.disruption_minutes)}m</strong></span>
                      <span className="telemetry-sep">|</span>
                      <span>Confidence: <strong>{Math.round(item.confidence_pct)}%</strong></span>
                    </div>

                    {item.explanation && (
                      <p className="milestone-explanation-p">{item.explanation}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty-audit-container">
          <EmptyState
            icon={<CalendarClock size={36} />}
            title="No Block Decisions Recorded"
            description="No maintenance blocks match this filter criteria. Run an optimization search in the Optimal Block Planner to record decisions."
            action={
              <button
                type="button"
                className="planner-launch-button"
                onClick={() => onNavigate('planner')}
              >
                <span>OPEN BLOCK PLANNER</span>
                <ChevronRight size={14} />
              </button>
            }
          />
        </div>
      )}
    </div>
  );
};
