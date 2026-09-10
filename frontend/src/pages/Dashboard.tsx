import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  ShieldCheck,
  CalendarClock,
  Radio,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api, fallbackAnalytics, demoAssets, sectionDetails } from '../api';
import { AnalyticsData, Asset } from '../types';
import { HealthMeter } from '../components/UI';
import { PageId } from '../components/Sidebar';
import { RailwayMotion, UP_TRACK_PATH } from '../components/RailwayMotion';

interface DashboardProps {
  onNavigate: (page: PageId, filter?: { section?: string }) => void;
}

interface NetworkSectionDef {
  id: string;
  name: string;
  lineType: 'UP' | 'DOWN';
  startStation: string;
  endStation: string;
  nodeX: number;
  nodeY: number;
  segmentPath: string;
  risk: 'critical' | 'attention' | 'healthy';
  kmRange: string;
}

const corridorSections: NetworkSectionDef[] = [
  {
    id: 'SEC-001',
    name: 'Delhi Main – Shahdara UP',
    lineType: 'UP',
    startStation: 'DLI',
    endStation: 'DSA',
    nodeX: 110,
    nodeY: 75,
    segmentPath: 'M 30 75 L 210 75',
    risk: 'critical',
    kmRange: 'km 0.0 – 6.2',
  },
  {
    id: 'SEC-002',
    name: 'Delhi Main – Shahdara DOWN',
    lineType: 'DOWN',
    startStation: 'DSA',
    endStation: 'DLI',
    nodeX: 110,
    nodeY: 140,
    segmentPath: 'M 30 140 L 210 140',
    risk: 'critical',
    kmRange: 'km 6.2 – 0.0',
  },
  {
    id: 'SEC-003',
    name: 'Shahdara – Sahibabad UP',
    lineType: 'UP',
    startStation: 'DSA',
    endStation: 'SBB',
    nodeX: 340,
    nodeY: 71,
    segmentPath: 'M 210 75 C 260 73 300 70 380 70 L 460 70',
    risk: 'attention',
    kmRange: 'km 6.2 – 14.1',
  },
  {
    id: 'SEC-004',
    name: 'Shahdara – Sahibabad DOWN',
    lineType: 'DOWN',
    startStation: 'SBB',
    endStation: 'DSA',
    nodeX: 340,
    nodeY: 136,
    segmentPath: 'M 210 140 C 270 137 320 135 460 135',
    risk: 'attention',
    kmRange: 'km 14.1 – 6.2',
  },
  {
    id: 'SEC-005',
    name: 'Sahibabad – Ghaziabad UP',
    lineType: 'UP',
    startStation: 'SBB',
    endStation: 'GZB',
    nodeX: 580,
    nodeY: 77,
    segmentPath: 'M 460 70 C 520 70 570 80 710 80',
    risk: 'healthy',
    kmRange: 'km 14.1 – 20.4',
  },
  {
    id: 'SEC-006',
    name: 'Sahibabad – Ghaziabad DOWN',
    lineType: 'DOWN',
    startStation: 'GZB',
    endStation: 'SBB',
    nodeX: 580,
    nodeY: 132,
    segmentPath: 'M 460 135 C 560 135 630 130 710 130',
    risk: 'healthy',
    kmRange: 'km 20.4 – 14.1',
  },
];

const trafficMiniData = [
  { h: '00:00', v: 2 },
  { h: '02:00', v: 1 },
  { h: '04:00', v: 2 },
  { h: '06:00', v: 8 },
  { h: '08:00', v: 17 },
  { h: '10:00', v: 11 },
  { h: '12:00', v: 10 },
  { h: '14:00', v: 10 },
  { h: '16:00', v: 13 },
  { h: '18:00', v: 17 },
  { h: '20:00', v: 9 },
  { h: '22:00', v: 4 },
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<AnalyticsData>(fallbackAnalytics);
  const [priorityAssets, setPriorityAssets] = useState<Asset[]>([]);
  const [selectedSection, setSelectedSection] = useState<NetworkSectionDef | null>(null);
  const [hoveredSection, setHoveredSection] = useState<NetworkSectionDef | null>(null);

  useEffect(() => {
    api<AnalyticsData>('/analytics')
      .then((data) => setMetrics(data))
      .catch(() => setMetrics(fallbackAnalytics));

    api<Asset[]>('/assets?limit=8')
      .then((data) => setPriorityAssets(data))
      .catch(() => {
        setPriorityAssets(
          demoAssets.map((a) => ({
            asset_id: a[0],
            track_section: a[1],
            asset_type: a[2],
            health_score: a[3],
            urgency_score: a[4],
            failure_probability: a[5],
            risk_level: a[6],
            days_since_last_service: 210,
          }))
        );
      });
  }, []);

  const activeSection = selectedSection || hoveredSection;

  return (
    <div className="dashboard-editorial-workspace">
      {/* OPEN EDITORIAL HEADER — NO CHUNKY HERO CARD */}
      <header className="editorial-overview-header">
        <div className="overview-header-meta">
          <span className="corridor-indicator-text font-mono">
            <span className="telemetry-live-dot" />
            NORTHERN RAILWAY • DELHI DIVISION (NCR)
          </span>
          <span className="header-meta-sep">/</span>
          <span className="font-mono">DELHI MAIN ⇄ GHAZIABAD JN</span>
          <span className="header-meta-sep">/</span>
          <span className="font-mono">CANONICAL CORRIDOR MODEL</span>
        </div>

        <div className="overview-header-main">
          <div className="overview-title-column">
            <h1 className="overview-headline">
              Maintenance decisions, <span className="headline-emphasis">made around the railway.</span>
            </h1>
            <p className="overview-narrative">
              Multivariate asset condition modeling combined with 24-hour goods-train operating density across six canonical corridor sections. Deterministic block slots optimize maintenance throughput while mitigating cascading delays.
            </p>
          </div>

          <div className="overview-action-column">
            <button
              type="button"
              className="planner-launch-button"
              onClick={() => onNavigate('planner')}
              title="Open Automated Window Search"
            >
              <CalendarClock size={16} />
              <span>OPEN BLOCK PLANNER</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* EDITORIAL METRICS SPECIFICATION BAND — ZERO BOXED CARDS */}
      <section className="editorial-kpi-band" aria-label="Key Operational Performance Indicators">
        <div className="kpi-band-column">
          <div className="kpi-label-row">
            <span className="kpi-label">CRITICAL ASSETS</span>
            <span className="kpi-dot dot-critical" />
          </div>
          <div className="kpi-val-row font-mono">
            {metrics?.critical_assets ?? 94}
          </div>
          <div className="kpi-sub-text">Immediate block required</div>
        </div>

        <div className="kpi-band-divider" />

        <div className="kpi-band-column">
          <div className="kpi-label-row">
            <span className="kpi-label">MAINTENANCE BACKLOG</span>
            <span className="kpi-dot dot-attention" />
          </div>
          <div className="kpi-val-row font-mono">
            {metrics?.maintenance_backlog ?? 124}
          </div>
          <div className="kpi-sub-text">&gt; 180 days since service</div>
        </div>

        <div className="kpi-band-divider" />

        <div className="kpi-band-column">
          <div className="kpi-label-row">
            <span className="kpi-label">AVG ASSET HEALTH</span>
            <span className="kpi-dot dot-healthy" />
          </div>
          <div className="kpi-val-row font-mono">
            {metrics?.average_asset_health ? `${metrics.average_asset_health}%` : '72.4%'}
          </div>
          <div className="kpi-meter-addon">
            <HealthMeter value={metrics?.average_asset_health || 72} showNumeric={false} compact />
          </div>
        </div>

        <div className="kpi-band-divider" />

        <div className="kpi-band-column">
          <div className="kpi-label-row">
            <span className="kpi-label">APPROVED BLOCKS</span>
          </div>
          <div className="kpi-val-row font-mono">
            {metrics?.approved_blocks ?? 14}
          </div>
          <div className="kpi-sub-text">Verified decisions</div>
        </div>

        <div className="kpi-band-divider" />

        <div className="kpi-band-column">
          <div className="kpi-label-row">
            <span className="kpi-label">RECOMMENDATIONS</span>
          </div>
          <div className="kpi-val-row font-mono">
            {metrics?.recommendations_total ?? 18}
          </div>
          <div className="kpi-sub-text">Optimized candidate slots</div>
        </div>

        <div className="kpi-band-divider" />

        <div className="kpi-band-column kpi-highlight-col">
          <div className="kpi-label-row">
            <span className="kpi-label">DELAY REDUCTION</span>
            <span className="kpi-badge-gold font-mono">GAIN</span>
          </div>
          <div className="kpi-val-row font-mono val-gold">
            {metrics?.expected_delay_reduction_pct ? `${metrics.expected_delay_reduction_pct}%` : '34.8%'}
          </div>
          <div className="kpi-sub-text">Throughput optimization</div>
        </div>
      </section>

      {/* HERO VISUAL: EXPANDED OPEN CANVASES FOR CORRIDOR TOPOLOGY */}
      <section className="corridor-topology-section">
        <div className="topology-editorial-header">
          <div className="topology-title-block">
            <span className="topology-eyebrow font-mono">CORRIDOR INFRASTRUCTURE TOPOLOGY</span>
            <h2 className="topology-title">Delhi–Ghaziabad Operational Railway Network (20.4 km)</h2>
          </div>

          <div className="topology-header-telemetry font-mono">
            <span className="telemetry-live-dot" />
            <span>SIMULATED NETWORK ACTIVITY</span>
            {selectedSection && (
              <button
                type="button"
                className="clear-selection-btn"
                onClick={() => setSelectedSection(null)}
              >
                CLEAR FILTER
              </button>
            )}
          </div>
        </div>

        {/* Large Open Canvas Topology SVG */}
        <div className="topology-canvas-container">
          <svg viewBox="0 0 740 210" className="topology-schematic-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="topologyCanvasGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10261C" stopOpacity="0.03" />
                <stop offset="50%" stopColor="#10261C" stopOpacity="0.015" />
                <stop offset="100%" stopColor="#10261C" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {/* Subtle corridor background bed */}
            <rect x="10" y="10" width="720" height="190" rx="4" fill="url(#topologyCanvasGrad)" />

            {/* STATION NODAL WAYPOINTS */}
            <g className="station-waypoints-group" opacity="0.9">
              {/* Delhi Main */}
              <line x1="45" y1="36" x2="45" y2="175" stroke="#D8D2C5" strokeWidth="1" strokeDasharray="2 3" />
              <rect x="22" y="20" width="46" height="16" rx="2" fill="#FBFAF6" stroke="#D8D2C5" />
              <text x="45" y="31" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#10261C">DLI 0k</text>

              {/* Shahdara */}
              <line x1="210" y1="36" x2="210" y2="175" stroke="#D8D2C5" strokeWidth="1" strokeDasharray="2 3" />
              <rect x="186" y="20" width="48" height="16" rx="2" fill="#FBFAF6" stroke="#D8D2C5" />
              <text x="210" y="31" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#10261C">DSA 6k</text>

              {/* Sahibabad */}
              <line x1="460" y1="36" x2="460" y2="175" stroke="#D8D2C5" strokeWidth="1" strokeDasharray="2 3" />
              <rect x="434" y="20" width="52" height="16" rx="2" fill="#FBFAF6" stroke="#D8D2C5" />
              <text x="460" y="31" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#10261C">SBB 14k</text>

              {/* Ghaziabad */}
              <line x1="695" y1="36" x2="695" y2="175" stroke="#D8D2C5" strokeWidth="1" strokeDasharray="2 3" />
              <rect x="668" y="20" width="54" height="16" rx="2" fill="#FBFAF6" stroke="#D8D2C5" />
              <text x="695" y="31" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="monospace" fill="#10261C">GZB 20k</text>
            </g>

            {/* BASE TRACK LINES (UP & DOWN) */}
            <path
              d={UP_TRACK_PATH}
              fill="none"
              stroke="#294B39"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity={selectedSection && selectedSection.lineType !== 'UP' ? 0.3 : 0.85}
            />
            <path
              d={UP_TRACK_PATH}
              fill="none"
              stroke="#B59A63"
              strokeWidth="1.2"
              strokeDasharray="3 6"
              opacity="0.45"
            />

            <path
              d="M 30 140 L 150 140 C 220 140 270 135 370 135 L 530 135 C 600 135 640 130 710 130"
              fill="none"
              stroke="#68736D"
              strokeWidth="3.5"
              strokeDasharray="8 4"
              strokeLinecap="round"
              opacity={selectedSection && selectedSection.lineType !== 'DOWN' ? 0.3 : 0.85}
            />

            {/* Crossover Switches */}
            <path d="M 180 140 L 240 75" fill="none" stroke="#B59A63" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.6" />
            <path d="M 430 136 L 490 70" fill="none" stroke="#B59A63" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.6" />

            {/* INTERACTIVE TRACK SECTIONS */}
            {corridorSections.map((sec) => {
              const isSelected = selectedSection?.id === sec.id;
              const isHovered = hoveredSection?.id === sec.id;
              const isDimmed = selectedSection && !isSelected;

              let strokeColor = '#2D6A4F';
              if (sec.risk === 'critical') strokeColor = '#B6453D';
              else if (sec.risk === 'attention') strokeColor = '#B88935';

              return (
                <g
                  key={sec.id}
                  className={`topology-segment-node ${isSelected ? 'is-selected' : ''}`}
                  onMouseEnter={() => setHoveredSection(sec)}
                  onMouseLeave={() => setHoveredSection(null)}
                  onClick={() => setSelectedSection(isSelected ? null : sec)}
                  style={{ cursor: 'pointer' }}
                >
                  {(isSelected || isHovered) && (
                    <path
                      d={sec.segmentPath}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="9"
                      strokeLinecap="round"
                      opacity="0.25"
                    />
                  )}

                  <path
                    d={sec.segmentPath}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '5' : isHovered ? '4.5' : '3.5'}
                    strokeLinecap="round"
                    opacity={isDimmed ? 0.25 : 1}
                  />

                  {/* Section Pin with Metric */}
                  <g transform={`translate(${sec.nodeX}, ${sec.nodeY})`}>
                    {isSelected && (
                      <circle r="14" fill="none" stroke={strokeColor} strokeWidth="1.5" opacity="0.4" className="node-pulse-ring" />
                    )}
                    <circle
                      r={isSelected ? 9 : 7}
                      fill="#FBFAF6"
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : 2}
                      opacity={isDimmed ? 0.35 : 1}
                    />
                    <circle
                      r={isSelected ? 3.5 : 2.5}
                      fill={strokeColor}
                      opacity={isDimmed ? 0.35 : 1}
                    />
                    <text
                      y={sec.lineType === 'UP' ? -13 : 22}
                      textAnchor="middle"
                      fontSize={isSelected ? '9.5' : '8.5'}
                      fontWeight="700"
                      fontFamily="monospace"
                      fill={isDimmed ? '#999' : '#10261C'}
                    >
                      {sec.id}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Ambient Deterministic Train Motion */}
            <RailwayMotion />

            {/* Route Orientation Chevrons */}
            <text x="35" y="66" fill="#68736D" fontSize="8" fontFamily="Inter" fontWeight="700" opacity="0.9">UP MAIN →</text>
            <text x="35" y="156" fill="#68736D" fontSize="8" fontFamily="Inter" fontWeight="700" opacity="0.9">← DOWN MAIN</text>
          </svg>
        </div>

        {/* Dynamic Telemetry HUD Bar */}
        {activeSection && (
          <div className="topology-telemetry-hud" role="region" aria-label="Section Telemetry Details">
            <div className="hud-meta-block">
              <div className="hud-title-line">
                <span className="hud-section-id font-mono">{activeSection.id}</span>
                <span className="hud-section-name">{sectionDetails[activeSection.id]?.name || activeSection.name}</span>
                <span className={`hud-risk-tag tag-${activeSection.risk}`}>
                  {activeSection.risk.toUpperCase()}
                </span>
                <span className="hud-km-range font-mono">{activeSection.kmRange}</span>
              </div>
              <span className="hud-details-sub">
                Track: <strong>{activeSection.lineType} Main</strong> • Span: {activeSection.startStation} to {activeSection.endStation} • Diagnostic sensors synchronized
              </span>
            </div>
            <button
              type="button"
              className="hud-action-button"
              onClick={() => onNavigate('assets', { section: activeSection.id })}
            >
              <span>INSPECT ASSETS</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </section>

      {/* ROW 2: EDITORIAL TWO-COLUMN WORKBENCH */}
      <div className="overview-dual-columns">
        {/* Priority Asset Action Register */}
        <section className="editorial-column-container">
          <div className="column-header-line">
            <div>
              <span className="column-eyebrow font-mono">ACTION QUEUE</span>
              <h3 className="column-title">Priority Assets Requiring Block Planning</h3>
            </div>
            <button
              type="button"
              className="column-link-action font-mono"
              onClick={() => onNavigate('assets')}
            >
              <span>REGISTER</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="editorial-priority-list">
            {priorityAssets.slice(0, 6).map((asset) => (
              <div
                key={asset.asset_id}
                className="priority-editorial-row"
                onClick={() => onNavigate('assets')}
                title="Click to view asset condition dossier"
              >
                <span className={`severity-indicator-stripe dot-${(asset.risk_level || 'Healthy').toLowerCase()}`} />
                <div className="priority-row-meta">
                  <div className="priority-row-id font-mono">
                    <span>{asset.asset_id}</span>
                    <span className="priority-section-badge font-mono">{asset.track_section}</span>
                  </div>
                  <span className="priority-asset-desc">{asset.asset_type}</span>
                </div>
                <div className="priority-score-block">
                  <span className="priority-urgency-num font-mono">{Math.round(asset.urgency_score || 0)}</span>
                  <span className="priority-urgency-sub font-mono">URGENCY</span>
                </div>
                <ChevronRight size={14} className="row-hover-arrow" />
              </div>
            ))}
          </div>
        </section>

        {/* 24-Hour Traffic Operating Pressure Mini-Curve */}
        <section className="editorial-column-container">
          <div className="column-header-line">
            <div>
              <span className="column-eyebrow font-mono">OPERATIONAL DENSITY</span>
              <h3 className="column-title">24h Goods-Train Pressure Profile</h3>
            </div>
            <button
              type="button"
              className="column-link-action font-mono"
              onClick={() => onNavigate('traffic')}
            >
              <span>TIMELINE</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="editorial-chart-stage">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trafficMiniData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD2" vertical={false} />
                <XAxis
                  dataKey="h"
                  tickLine={false}
                  axisLine={{ stroke: '#D8D2C5' }}
                  tick={{ fontSize: 10, fill: '#68736D', fontFamily: 'monospace' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#D8D2C5' }}
                  tick={{ fontSize: 10, fill: '#68736D', fontFamily: 'monospace' }}
                  width={34}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#10261C',
                    border: '1px solid #1D3A2B',
                    borderRadius: '2px',
                    color: '#F5F2EA',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  itemStyle={{ color: '#B59A63' }}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  name="Trains/Hr"
                  stroke="#10261C"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#B59A63', stroke: '#10261C', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#F5F2EA', stroke: '#B59A63', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="chart-annotation-line font-mono">
              <span className="annotation-marker">■</span>
              <span>OPTIMAL CLEARANCE WINDOW: 12:00–16:00 (MINIMAL FREIGHT CONFLICTS)</span>
            </div>
          </div>

          {/* Operational Guidance Callout */}
          <div className="editorial-guidance-bar">
            <div className="guidance-icon-wrap">
              <ShieldCheck size={20} />
            </div>
            <div className="guidance-text-wrap">
              <span className="guidance-bold">Decision Discipline:</span>
              <span>
                Safety-critical track defects trigger immediate prioritization. Windows are ranked to avoid freight congestion bottlenecks.
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
