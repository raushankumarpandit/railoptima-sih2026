import React from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  Activity,
  BarChart3,
  AlertTriangle,
  ShieldCheck,
  Database,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { Logo } from './Logo';

export type PageId = 'dashboard' | 'planner' | 'assets' | 'traffic' | 'backlog' | 'blocks' | 'analytics';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Network Overview', icon: LayoutDashboard },
  { id: 'planner', label: 'Optimal Block Planner', icon: CalendarClock },
  { id: 'assets', label: 'Asset Intelligence', icon: Activity },
  { id: 'traffic', label: 'Traffic Forecast', icon: BarChart3 },
  { id: 'backlog', label: 'Maintenance Backlog', icon: AlertTriangle },
  { id: 'blocks', label: 'Block Decisions', icon: ShieldCheck },
  { id: 'analytics', label: 'System Analytics', icon: Database },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  onLogout,
}) => {
  return (
    <aside className={`ops-sidebar ${collapsed ? 'is-collapsed' : ''}`} aria-label="Railway Operations Navigation">
      {/* Brand Header */}
      <div className="sidebar-brand-area">
        <div className="sidebar-brand-inner">
          <Logo variant={collapsed ? 'mark' : 'full'} theme="dark" size={34} />
        </div>
        <button
          type="button"
          className="collapse-toggle-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Corridor Sector Identification */}
      <div className="corridor-badge-section">
        {!collapsed ? (
          <div className="corridor-badge-full">
            <span className="corridor-label">OPERATIONAL SECTOR</span>
            <div className="corridor-route">
              <span className="corridor-station">DELHI</span>
              <span className="corridor-arrow">⇄</span>
              <span className="corridor-station">GHAZIABAD</span>
            </div>
            <div className="corridor-meta">6 SECTIONS • CANONICAL MVP</div>
          </div>
        ) : (
          <div className="corridor-badge-compact" title="Delhi–Ghaziabad Corridor">
            <Radio size={14} className="pulse-icon" />
            <span>NCR</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav" aria-label="Main system modules">
        <div className="nav-group-label">{!collapsed && 'CONTROL MODULES'}</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectPage(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-item-indicator" />
              <span className="nav-item-icon">
                <Icon size={18} />
              </span>
              {!collapsed && (
                <span className="nav-item-text">
                  <span className="nav-item-title">{item.label}</span>
                  {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Telemetry Status & Footer */}
      <div className="sidebar-footer-area">
        {/* System Status */}
        <div className="system-status-chip">
          <span className="status-live-dot" />
          {!collapsed ? (
            <div className="status-text-block">
              <span className="status-heading">DECISION MODELS</span>
              <span className="status-sub">Online & Synced</span>
            </div>
          ) : (
            <div className="status-compact-dot" title="Decision models online" />
          )}
        </div>

        {/* Simulated Data Disclaimer */}
        {!collapsed && (
          <div className="simulated-data-notice">
            <div className="notice-inner">
              <span className="notice-amber-dot" />
              <div>
                <span className="notice-title">SIMULATED DATA</span>
                <span className="notice-sub">For demonstration only</span>
              </div>
            </div>
          </div>
        )}

        {/* Sign Out Action */}
        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={onLogout}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
