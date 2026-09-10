import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Train,
  ArrowDownRight,
  Sliders,
  Radio,
  Check,
} from 'lucide-react';
import { api, canonicalSections, sectionDetails, fallbackTrafficForecast } from '../api';
import { ForecastHour } from '../types';
import { PageHeader, PanelHeader } from '../components/UI';

export const Traffic: React.FC = () => {
  const [section, setSection] = useState('SEC-001');
  const [date, setDate] = useState('2026-08-01');
  const [trafficLevel, setTrafficLevel] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [forecastData, setForecastData] = useState<ForecastHour[]>(fallbackTrafficForecast);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api<{ forecast: ForecastHour[] }>(`/traffic/forecast?section=${section}&date=${date}&hours=24`)
      .then((res) => {
        if (res?.forecast && res.forecast.length > 0) {
          setForecastData(res.forecast);
        } else {
          setForecastData(fallbackTrafficForecast);
        }
      })
      .catch(() => {
        setForecastData(fallbackTrafficForecast);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [section, date]);

  const displayedData = trafficLevel === 'ALL'
    ? forecastData
    : forecastData.filter((d) => d.traffic_level === trafficLevel);

  const lowDensityWindows = forecastData
    .filter((d) => d.traffic_level === 'LOW')
    .slice(0, 4);

  return (
    <div className="traffic-view-content">
      <PageHeader
        eyebrow="CORRIDOR TRAFFIC PRESSURE"
        title="24-Hour Operating Density & Clearances"
        description="Hourly goods-train operating density derived from canonical forecast records on the Delhi–Ghaziabad corridor. Identifies optimal track possession clearances for scheduled maintenance."
      />

      {/* FILTER & SELECTION CONTROLS PANEL */}
      <div className="ops-panel traffic-controls-bar">
        <div className="traffic-controls-grid">
          <div className="control-group">
            <label htmlFor="traffic-section" className="control-label">
              TRACK SECTION
            </label>
            <select
              id="traffic-section"
              className="control-select font-mono"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              {canonicalSections.map((s) => (
                <option key={s} value={s}>
                  {s}: {sectionDetails[s]?.name || s}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="traffic-date" className="control-label">
              FORECAST DATE
            </label>
            <input
              id="traffic-date"
              type="date"
              className="control-input font-mono"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="control-group">
            <label htmlFor="traffic-filter" className="control-label">
              DENSITY LEVEL FILTER
            </label>
            <select
              id="traffic-filter"
              className="control-select font-mono"
              value={trafficLevel}
              onChange={(e) => setTrafficLevel(e.target.value as any)}
            >
              <option value="ALL">ALL LEVELS (24 Hours)</option>
              <option value="LOW">LOW DENSITY ONLY (≤ 3 Trains/Hr)</option>
              <option value="MEDIUM">MEDIUM DENSITY ONLY (4–9 Trains/Hr)</option>
              <option value="HIGH">HIGH DENSITY ONLY (≥ 10 Trains/Hr)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 24-HOUR HORIZONTAL OPERATIONAL TIMELINE STRIP */}
      <div className="ops-panel operational-timeline-band" aria-label="24-Hour Corridor Density Timeline">
        <div className="timeline-header-row">
          <div className="timeline-title-block">
            <span className="timeline-title font-mono">24-HOUR CORRIDOR POSSESSION WINDOW TIMELINE</span>
            <span className="timeline-sub font-mono">Green segments denote compatible low-density maintenance intervals (≤ 3 trains/hr)</span>
          </div>
          <div className="timeline-legend-pills">
            <span className="legend-chip chip-low font-mono">LOW ≤3</span>
            <span className="legend-chip chip-med font-mono">MED 4–9</span>
            <span className="legend-chip chip-high font-mono">HIGH ≥10</span>
          </div>
        </div>

        {/* 24 Hour Visual Density Blocks */}
        <div className="timeline-blocks-track">
          {forecastData.map((hr) => {
            const isLow = hr.traffic_level === 'LOW';
            const isHigh = hr.traffic_level === 'HIGH';
            const levelClass = isLow ? 'level-low' : isHigh ? 'level-high' : 'level-medium';

            return (
              <div
                key={hr.hour}
                className={`timeline-hour-slot ${levelClass}`}
                title={`Hour ${String(hr.hour).padStart(2, '0')}:00 — ${hr.predicted_train_count.toFixed(1)} trains/hr (${hr.traffic_level})`}
              >
                <span className="slot-hour-label font-mono">{String(hr.hour).padStart(2, '0')}</span>
                <div className="slot-bar-fill" />
                <span className="slot-count font-mono">{Math.round(hr.predicted_train_count)}</span>
                {isLow && <span className="slot-clearance-dot" title="Clearance window" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN SPLIT: 24H BAR CHART + OPERATIONAL WINDOWS */}
      <div className="dashboard-grid-split">
        {/* 24-Hour Density Bar Chart */}
        <section className="ops-panel traffic-chart-panel">
          <PanelHeader
            title={`Hourly Goods-Train Density Profile • ${section}`}
            badge={sectionDetails[section]?.type || 'CORRIDOR TRACK'}
          />

          <div className="chart-wrapper-inner">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={displayedData} margin={{ top: 16, right: 16, left: -14, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD2" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tickLine={false}
                  axisLine={{ stroke: '#D8D2C5' }}
                  tick={{ fontSize: 10, fill: '#68736D', fontFamily: 'monospace' }}
                  tickFormatter={(val) => `${String(val).padStart(2, '0')}:00`}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#D8D2C5' }}
                  tick={{ fontSize: 10, fill: '#68736D', fontFamily: 'monospace' }}
                  width={34}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(29, 58, 43, 0.05)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload as ForecastHour;
                    return (
                      <div className="custom-chart-tooltip">
                        <div className="tooltip-hour font-mono">
                          {String(d.hour).padStart(2, '0')}:00 — {String(d.hour + 1).padStart(2, '0')}:00
                        </div>
                        <div className="tooltip-val font-mono">
                          {d.predicted_train_count.toFixed(1)} <span className="unit">trains/hr</span>
                        </div>
                        <div className={`tooltip-level level-${d.traffic_level.toLowerCase()} font-mono`}>
                          Operating Density: {d.traffic_level}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="predicted_train_count" radius={[3, 3, 0, 0]}>
                  {displayedData.map((entry, index) => {
                    let fillColor = '#1D3A2B';
                    if (entry.traffic_level === 'LOW') fillColor = '#2D6A4F';
                    else if (entry.traffic_level === 'HIGH') fillColor = '#B6453D';
                    else fillColor = '#B88935';
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Operational Windows Cards & Guidance */}
        <div className="traffic-side-column">
          <section className="ops-panel operational-windows-panel">
            <PanelHeader title="Low-Density Maintenance Windows" badge="CLEARANCE OPPORTUNITIES" />

            <div className="windows-cards-grid">
              {lowDensityWindows.length > 0 ? (
                lowDensityWindows.map((slot) => (
                  <div key={slot.hour} className="window-opportunity-card">
                    <div className="window-card-top">
                      <span className="window-density-badge badge-low font-mono">LOW DENSITY</span>
                      <span className="window-hour-tag font-mono">
                        {String(slot.hour).padStart(2, '0')}:00
                      </span>
                    </div>
                    <div className="window-card-body">
                      <div className="train-count-row">
                        <span className="train-count-num font-mono">
                          {slot.predicted_train_count.toFixed(1)}
                        </span>
                        <span className="train-count-label">trains / hour</span>
                      </div>
                      <span className="window-subtext">Clearance opportunity for track maintenance</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-low-density-box font-mono">
                  No low-density windows detected for this filter.
                </div>
              )}
            </div>

            {/* Operational Planning Guidance Note */}
            <div className="traffic-advisory-banner">
              <div className="advisory-icon-wrapper">
                <AlertTriangle size={18} />
              </div>
              <div className="advisory-text-block">
                <h5 className="advisory-title font-mono">OPERATIONAL SCHEDULING RULE:</h5>
                <p className="advisory-desc">
                  Maintenance block scheduling must prioritize low-density operating windows (≤ 3 trains/hour) when asset urgency permits, avoiding corridor bottleneck hours between 07:00–11:00 and 17:00–21:00.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
