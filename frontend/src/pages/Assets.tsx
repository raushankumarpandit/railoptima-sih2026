import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Activity,
  CalendarClock,
  Gauge,
  AlertOctagon,
  ShieldCheck,
  Zap,
  FileText,
  Sliders,
} from 'lucide-react';
import { api, demoAssets, sectionDetails } from '../api';
import { Asset } from '../types';
import { HealthMeter, Modal, PageHeader, RiskPill } from '../components/UI';
import { PageId } from '../components/Sidebar';

interface AssetsProps {
  initialFilter?: { section?: string };
  onNavigate: (page: PageId, filter?: { section?: string }) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const Assets: React.FC<AssetsProps> = ({ initialFilter, onNavigate, onToast }) => {
  const [data, setData] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialFilter?.section || '');
  const [selectedRisk, setSelectedRisk] = useState<'All' | 'Critical' | 'Attention' | 'Healthy'>('All');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = () => {
    setIsRefreshing(true);
    api<Asset[]>('/assets?limit=80')
      .then((res) => {
        setData(res);
      })
      .catch(() => {
        setData(
          demoAssets.map((a) => ({
            asset_id: a[0],
            track_section: a[1],
            asset_type: a[2],
            health_score: a[3],
            urgency_score: a[4],
            failure_probability: a[5],
            risk_level: a[6],
            age_years: 18.2,
            days_since_last_service: 220,
            vibration_mm_s: 5.2,
            rail_wear_mm: 3.1,
            ultrasonic_flaw_score: 12.0,
            track_geometry_deviation_mm: 4.5,
          }))
        );
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Keyboard shortcut listener for '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered dataset
  const filteredAssets = useMemo(() => {
    return data.filter((item) => {
      const matchesQuery =
        !searchQuery ||
        `${item.asset_id} ${item.track_section} ${item.asset_type} ${item.section_name || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesRisk =
        selectedRisk === 'All' ||
        String(item.risk_level).toLowerCase() === selectedRisk.toLowerCase();

      return matchesQuery && matchesRisk;
    });
  }, [data, searchQuery, selectedRisk]);

  const riskCounts = useMemo(() => {
    return {
      all: data.length,
      critical: data.filter((a) => String(a.risk_level).toLowerCase() === 'critical').length,
      attention: data.filter((a) => String(a.risk_level).toLowerCase() === 'attention').length,
      healthy: data.filter((a) => String(a.risk_level).toLowerCase() === 'healthy').length,
    };
  }, [data]);

  return (
    <div className="assets-view-content">
      <PageHeader
        eyebrow="INFRASTRUCTURE CONDITION MONITOR"
        title="Asset Intelligence Register & Telemetry"
        description="Condition-monitored track, switch, and TRD assets across the Delhi–Ghaziabad corridor. Urgency and failure probabilities are evaluated by models trained on canonical inspection and defect records."
      />

      <div className="ops-panel assets-table-panel">
        {/* Table Toolbar: Search & Risk Filter Buttons */}
        <div className="assets-toolbar-row">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              data-global-search
              className="assets-search-input"
              placeholder="Search asset ID, section or asset type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd className="keyboard-shortcut-tag" title="Press / to search">
              /
            </kbd>
          </div>

          <div className="toolbar-controls-right">
            <div className="risk-filter-chips">
              {(['All', 'Critical', 'Attention', 'Healthy'] as const).map((r) => {
                const count =
                  r === 'All'
                    ? riskCounts.all
                    : r === 'Critical'
                    ? riskCounts.critical
                    : r === 'Attention'
                    ? riskCounts.attention
                    : riskCounts.healthy;

                return (
                  <button
                    key={r}
                    type="button"
                    className={`risk-chip-btn ${selectedRisk === r ? 'is-active' : ''}`}
                    onClick={() => setSelectedRisk(r)}
                  >
                    <span>{r}</span>
                    <span className="chip-count font-mono">{count}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="refresh-data-btn"
              onClick={fetchAssets}
              title="Refresh asset telemetry"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-icon' : ''} />
            </button>
          </div>
        </div>

        {/* Live Filter Summary Bar */}
        <div className="table-summary-bar">
          <div className="summary-left">
            <span className="summary-text font-mono">
              ENGINEERING REGISTER • Showing <strong>{filteredAssets.length}</strong> of {data.length} assets
            </span>
            {searchQuery && (
              <span className="search-active-pill font-mono">
                Query: &quot;{searchQuery}&quot;
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              </span>
            )}
          </div>
          <span className="summary-hint font-mono">Click row to open condition dossier</span>
        </div>

        {/* Tabular Asset Condition Register */}
        <div className="table-responsive-container">
          <table className="assets-data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>ASSET ID</th>
                <th style={{ width: '120px' }}>SECTION</th>
                <th style={{ width: '160px' }}>ASSET CLASSIFICATION</th>
                <th style={{ width: '140px' }}>HEALTH INDEX</th>
                <th style={{ width: '130px' }}>URGENCY SCORE</th>
                <th style={{ width: '120px' }}>FAILURE PROB.</th>
                <th style={{ width: '90px' }}>AGE</th>
                <th style={{ width: '130px' }}>LAST SERVICE</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <tr
                    key={asset.asset_id}
                    className="asset-table-row"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <td className="font-mono asset-id-cell">
                      <b>{asset.asset_id}</b>
                    </td>
                    <td className="font-mono section-cell">
                      <span className="section-cell-badge">{asset.track_section}</span>
                    </td>
                    <td className="asset-type-cell">
                      <span className="asset-type-text">{asset.asset_type}</span>
                    </td>
                    <td>
                      <HealthMeter value={asset.health_score} compact={true} />
                    </td>
                    <td>
                      <RiskPill risk={asset.risk_level} score={asset.urgency_score} />
                    </td>
                    <td className="font-mono prob-cell">
                      {Math.round((asset.failure_probability || 0) * 100)}%
                    </td>
                    <td className="font-mono age-cell">
                      {asset.age_years ? `${asset.age_years.toFixed(1)} yr` : '—'}
                    </td>
                    <td className="font-mono service-cell">
                      {Math.round(asset.days_since_last_service)} days ago
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="empty-results-cell font-mono">
                    No infrastructure assets found matching current criteria. Try resetting search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSET ENGINEERING DOSSIER MODAL */}
      <Modal
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        eyebrow="ASSET CONDITION DOSSIER"
        title={selectedAsset?.asset_id || 'Asset Inspector'}
      >
        {selectedAsset && (
          <div className="asset-modal-content">
            {/* Asset Header Info */}
            <div className="modal-asset-meta-header">
              <div>
                <span className="meta-section font-mono">
                  {selectedAsset.track_section} • {sectionDetails[selectedAsset.track_section]?.name || selectedAsset.track_section}
                </span>
                <span className="meta-type">{selectedAsset.asset_type}</span>
              </div>
              <RiskPill risk={selectedAsset.risk_level} score={selectedAsset.urgency_score} size="md" />
            </div>

            {/* Top 3 Dominant Metrics */}
            <div className="dominant-metrics-grid">
              <div className="dominant-metric-cell">
                <span className="dominant-label">HEALTH INDEX</span>
                <div className="dominant-value-row">
                  <span className="dominant-value font-mono">
                    {Math.round(selectedAsset.health_score || 0)}
                  </span>
                  <span className="dominant-max font-mono">/100</span>
                </div>
                <div className="dominant-meter">
                  <HealthMeter value={selectedAsset.health_score} showNumeric={false} />
                </div>
              </div>

              <div className="dominant-metric-cell">
                <span className="dominant-label">URGENCY SCORE</span>
                <div className="dominant-value-row">
                  <span className="dominant-value font-mono">
                    {Math.round(selectedAsset.urgency_score || 0)}
                  </span>
                  <span className="dominant-max font-mono">/100</span>
                </div>
                <span className="dominant-sub font-mono">Maintenance Priority</span>
              </div>

              <div className="dominant-metric-cell">
                <span className="dominant-label">FAILURE PROBABILITY</span>
                <div className="dominant-value-row">
                  <span className="dominant-value font-mono">
                    {Math.round((selectedAsset.failure_probability || 0) * 100)}%
                  </span>
                </div>
                <span className="dominant-sub font-mono">In Next 180 Days</span>
              </div>
            </div>

            {/* Engineering Sensor Measurements */}
            <div className="engineering-specs-box">
              <div className="specs-section-title font-mono">ENGINEERING SENSOR TELEMETRY</div>
              <div className="specs-grid">
                <div className="spec-tile">
                  <span className="spec-tile-label font-mono">DAYS SINCE SERVICE</span>
                  <span className="spec-tile-val font-mono">
                    {Math.round(selectedAsset.days_since_last_service || 0)} days
                  </span>
                </div>
                <div className="spec-tile">
                  <span className="spec-tile-label font-mono">VIBRATION VELOCITY</span>
                  <span className="spec-tile-val font-mono">
                    {Number(selectedAsset.vibration_mm_s || 0).toFixed(2)} mm/s
                  </span>
                </div>
                <div className="spec-tile">
                  <span className="spec-tile-label font-mono">RAIL HEAD WEAR</span>
                  <span className="spec-tile-val font-mono">
                    {Number(selectedAsset.rail_wear_mm || 0).toFixed(2)} mm
                  </span>
                </div>
                <div className="spec-tile">
                  <span className="spec-tile-label font-mono">ASSET SERVICE AGE</span>
                  <span className="spec-tile-val font-mono">
                    {selectedAsset.age_years ? `${selectedAsset.age_years.toFixed(1)} yr` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Decision Relevance Statement */}
            <div className="decision-relevance-card">
              <div className="relevance-title-row">
                <ShieldCheck size={16} />
                <span className="font-mono">OPERATIONAL DECISION RELEVANCE</span>
              </div>
              <p className="relevance-text">
                {selectedAsset.urgency_score >= 70
                  ? 'CRITICAL DEFECT RISK: This asset has exceeded standard degradation tolerances. Requires prioritized maintenance block scheduling to prevent operational speed restriction.'
                  : selectedAsset.urgency_score >= 40
                  ? 'ATTENTION ADVISORY: Approaching threshold wear or inspection interval. Scheduled for preventive block inclusion during standard low-density night windows.'
                  : 'NORMAL CONDITION: Operating safely within designed safety tolerances. Standard periodic inspection cadence applies.'}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions-bar">
              <button
                type="button"
                className="modal-secondary-btn font-mono"
                onClick={() => setSelectedAsset(null)}
              >
                CLOSE DOSSIER
              </button>
              <button
                type="button"
                className="modal-primary-btn font-mono"
                onClick={() => {
                  const sec = selectedAsset.track_section;
                  setSelectedAsset(null);
                  onNavigate('planner', { section: sec });
                }}
              >
                <span>PLAN BLOCK FOR THIS ASSET</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
