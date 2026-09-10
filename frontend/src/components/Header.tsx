import React from 'react';
import { Menu, UserCircle, Activity } from 'lucide-react';
import { User } from '../types';
import { PageId } from './Sidebar';

interface HeaderProps {
  currentPage: PageId;
  user: User | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

const pageMetadata: Record<PageId, { title: string; subtitle: string; tag: string }> = {
  dashboard: {
    title: 'Corridor Overview',
    subtitle: 'Delhi–Ghaziabad Railway Division',
    tag: 'SYSTEM CONSOLE',
  },
  planner: {
    title: 'Optimal Block Planner',
    subtitle: 'AI-Assisted Scheduling & Risk Mitigation',
    tag: 'DECISION ENGINE',
  },
  assets: {
    title: 'Asset Intelligence',
    subtitle: 'Track Condition, Sensors & Defect Degradation',
    tag: 'CONDITION MONITOR',
  },
  traffic: {
    title: 'Traffic Density Forecast',
    subtitle: 'Goods-Train Operating Pressure & Clearances',
    tag: 'OPERATIONAL DENSITY',
  },
  backlog: {
    title: 'Maintenance Backlog',
    subtitle: 'Action Queue & Urgency Rankings',
    tag: 'MAINTENANCE QUEUE',
  },
  blocks: {
    title: 'Block Decisions & Audit',
    subtitle: 'Recommended Windows & Approvals Log',
    tag: 'DECISION AUDIT',
  },
  analytics: {
    title: 'Model Performance Lab',
    subtitle: 'ML Evaluation, Metrics & Gradient Boost Models',
    tag: 'ALGORITHM TELEMETRY',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  user,
  sidebarCollapsed,
  onToggleSidebar,
}) => {
  const meta = pageMetadata[currentPage] || {
    title: 'Operations Console',
    subtitle: 'Delhi–Ghaziabad Corridor',
    tag: 'CONTROL ROOM',
  };

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'OP';

  return (
    <header className="ops-header">
      <div className="header-left">
        <button
          type="button"
          className="header-menu-btn"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={18} />
        </button>

        <div className="header-breadcrumb">
          <div className="header-eyebrow">
            <span>OPERATIONS CONTROL</span>
            <span className="eyebrow-sep">/</span>
            <span className="eyebrow-module">{meta.tag}</span>
          </div>
          <h1 className="header-title">{meta.title}</h1>
        </div>
      </div>

      <div className="header-right">
        {/* Live System Indicator */}
        <div className="header-telemetry-chip">
          <span className="telemetry-pulse-dot" />
          <span className="telemetry-label">Decision models online</span>
        </div>

        {/* Division Sector Pill */}
        <div className="header-division-chip">
          <Activity size={13} className="division-icon" />
          <span>NCR / Delhi Div</span>
        </div>

        {/* User Identity Chip */}
        <div className="header-user-chip" title={`${user?.full_name || 'Planner'} (${user?.role || 'Planner'})`}>
          <div className="user-avatar-circle font-mono">
            {userInitials}
          </div>
          <div className="user-meta-info">
            <span className="user-name">{user?.full_name || 'Operations Planner'}</span>
            <span className="user-role font-mono">{user?.role ? user.role.toUpperCase() : 'PLANNER'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
