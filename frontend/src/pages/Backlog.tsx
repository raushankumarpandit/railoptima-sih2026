import React, { useState, useEffect } from 'react';
import { ChevronRight, CalendarClock, Radio, Filter, AlertCircle, AlertTriangle } from 'lucide-react';
import { api, demoAssets, sectionDetails } from '../api';
import { MaintenanceTask } from '../types';
import { PageHeader, RiskPill } from '../components/UI';
import { PageId } from '../components/Sidebar';

interface BacklogProps {
  onNavigate: (page: PageId, filter?: { section?: string }) => void;
}

export const Backlog: React.FC<BacklogProps> = ({ onNavigate }) => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<'All' | 'Critical' | 'High' | 'Medium' | 'Low'>('All');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api<MaintenanceTask[]>('/maintenance?limit=60')
      .then((res) => {
        setTasks(res);
      })
      .catch(() => {
        setTasks(
          demoAssets.map((a, i) => ({
            record_id: `REC-${1000 + i}`,
            asset_id: a[0],
            track_section: a[1],
            issue: `${a[2]} Inspection & Track Geometry Realignment`,
            urgency: a[4],
            risk: a[6],
            days_since_service: 220,
            required_duration: 3,
            status: 'OPEN',
          }))
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (selectedRisk === 'All') return true;
    return String(t.risk).toLowerCase() === selectedRisk.toLowerCase();
  });

  return (
    <div className="backlog-view-content">
      <PageHeader
        eyebrow="ACTIONABLE MAINTENANCE QUEUE"
        title="Maintenance Backlog & Work Orders"
        description="Pending maintenance tasks ranked by predictive asset urgency, condition sensors, and elapsed interval since last overhaul. Select 'Plan Block' to initiate automated window ranking."
      />

      <div className="ops-panel backlog-table-panel">
        {/* Toolbar: Severity Tabs & Live Count */}
        <div className="backlog-toolbar-row">
          <div className="severity-tabs-group">
            <span className="filter-label font-mono">
              <Filter size={13} className="inline-icon" /> SEVERITY QUEUE:
            </span>
            {(['All', 'Critical', 'High', 'Medium', 'Low'] as const).map((level) => (
              <button
                key={level}
                type="button"
                className={`severity-tab-btn ${selectedRisk === level ? 'is-active' : ''}`}
                onClick={() => setSelectedRisk(level)}
              >
                <span>{level}</span>
              </button>
            ))}
          </div>

          <div className="live-records-counter">
            <Radio size={13} className="pulse-icon" />
            <span className="counter-text font-mono">
              <strong>{filteredTasks.length}</strong> OPEN WORK ORDERS
            </span>
          </div>
        </div>

        {/* Backlog Table */}
        <div className="table-responsive-container">
          <table className="backlog-data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>ASSET ID</th>
                <th style={{ width: '130px' }}>SECTION</th>
                <th>MAINTENANCE ISSUE / TASK</th>
                <th style={{ width: '110px' }}>URGENCY</th>
                <th style={{ width: '120px' }}>RISK TIER</th>
                <th style={{ width: '140px' }}>DAYS ELAPSED</th>
                <th style={{ width: '100px' }}>DURATION</th>
                <th style={{ width: '140px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const isCritical = String(task.risk).toLowerCase() === 'critical';
                  const isHigh = String(task.risk).toLowerCase() === 'high';
                  const isLow = String(task.risk).toLowerCase() === 'low';

                  return (
                    <tr
                      key={task.record_id || task.asset_id}
                      className={`backlog-table-row ${isCritical ? 'is-critical-row' : isHigh ? 'is-high-row' : isLow ? 'is-low-row' : ''}`}
                    >
                      <td className="font-mono asset-cell">
                        <b>{task.asset_id}</b>
                      </td>
                      <td className="font-mono section-cell">
                        <span className="section-badge-tag">{task.track_section}</span>
                      </td>
                      <td className="issue-desc-cell">
                        <div className="issue-title-row">
                          {isCritical && <AlertCircle size={13} className="critical-task-icon" />}
                          <span className="issue-title">{task.issue}</span>
                        </div>
                        <span className="issue-corridor-sub">
                          {sectionDetails[task.track_section]?.name || task.track_section}
                        </span>
                      </td>
                      <td className="font-mono urgency-score-cell">
                        <b className={isCritical ? 'text-critical' : ''}>{Math.round(task.urgency)}</b>
                        <span className="urgency-scale">/100</span>
                      </td>
                      <td>
                        <RiskPill risk={task.risk} showDot={true} size="sm" />
                      </td>
                      <td className="font-mono elapsed-cell">
                        <span className={task.days_since_service > 180 ? 'text-warn font-semibold' : ''}>
                          {Math.round(task.days_since_service)} days
                        </span>
                      </td>
                      <td className="font-mono duration-cell">
                        {task.required_duration} hrs
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="plan-block-action-btn font-mono"
                          onClick={() => onNavigate('planner', { section: task.track_section })}
                          title={`Plan maintenance block on ${task.track_section}`}
                        >
                          <span>PLAN BLOCK</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="empty-backlog-cell font-mono">
                    No open maintenance tasks matching the selected severity filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
