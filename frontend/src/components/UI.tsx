import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

// --- RISK PILL & STATUS BADGES ---
interface RiskPillProps {
  risk: string;
  score?: number;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export const RiskPill: React.FC<RiskPillProps> = ({ risk, score, showDot = true, size = 'md' }) => {
  const normalized = (risk || 'Healthy').toLowerCase();
  
  let variantClass = 'risk-healthy';
  if (normalized === 'critical') variantClass = 'risk-critical';
  else if (normalized === 'attention' || normalized === 'high') variantClass = 'risk-attention';
  else if (normalized === 'medium') variantClass = 'risk-medium';
  else if (normalized === 'low') variantClass = 'risk-low';

  return (
    <span className={`risk-pill ${variantClass} size-${size}`}>
      {showDot && <span className="risk-dot" />}
      <span className="risk-label">{risk}</span>
      {score !== undefined && (
        <span className="risk-value font-mono">
          {Math.round(score)}
        </span>
      )}
    </span>
  );
};

// --- HEALTH METER ---
interface HealthMeterProps {
  value: number;
  showNumeric?: boolean;
  compact?: boolean;
}

export const HealthMeter: React.FC<HealthMeterProps> = ({ value, showNumeric = true, compact = false }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value || 0)));
  
  let color = 'var(--success)';
  if (clamped < 40) color = 'var(--critical)';
  else if (clamped < 70) color = 'var(--warning)';

  return (
    <div className={`health-meter-wrapper ${compact ? 'is-compact' : ''}`} title={`Health Index: ${clamped}/100`}>
      <div className="health-track">
        <div 
          className="health-fill" 
          style={{ width: `${clamped}%`, backgroundColor: color }} 
        />
      </div>
      {showNumeric && <span className="health-numeric font-mono">{clamped}</span>}
    </div>
  );
};

// --- DIFFERENTIATED EDITORIAL KPI CARD ---
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  severity?: 'critical' | 'warn' | 'good' | 'neutral';
  kpiType?: 'urgency' | 'backlog' | 'health' | 'decisions' | 'optimization' | 'standard';
  badge?: string;
  visualAddon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  severity = 'neutral',
  kpiType = 'standard',
  badge,
  visualAddon,
}) => {
  return (
    <div className={`metric-card severity-${severity} type-${kpiType}`}>
      <div className="metric-accent-line" />
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {badge && <span className="metric-badge-tag">{badge}</span>}
      </div>
      <div className="metric-value-row">
        <span className="metric-value font-mono">{value}</span>
      </div>
      {visualAddon && <div className="metric-addon-slot">{visualAddon}</div>}
      <div className="metric-footer">
        <span className="metric-subtitle">{subtitle}</span>
      </div>
    </div>
  );
};

// --- PANEL HEADER ---
interface PanelHeaderProps {
  title: string;
  badge?: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  badge,
  actionText,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="panel-header">
      <div className="panel-header-left">
        <span className="panel-title">{title}</span>
        {badge && <span className="panel-badge font-mono">{badge}</span>}
      </div>
      {actionText && onAction && (
        <button 
          type="button" 
          className="panel-action-btn" 
          onClick={onAction}
        >
          <span>{actionText}</span>
          {actionIcon}
        </button>
      )}
    </div>
  );
};

// --- PAGE HEADER ---
interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow = 'OPERATIONS INTELLIGENCE',
  title,
  description,
  action,
}) => {
  return (
    <div className="page-header-row">
      <div>
        <span className="page-eyebrow">{eyebrow}</span>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
};

// --- TOAST NOTIFICATION ---
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-notification toast-${type}`} role="alert">
      {type === 'success' && <CheckCircle2 size={16} className="toast-icon" />}
      {type === 'error' && <AlertCircle size={16} className="toast-icon" />}
      {type === 'info' && <Info size={16} className="toast-icon" />}
      <span className="toast-text">{message}</span>
      {onClose && (
        <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss">
          <X size={13} />
        </button>
      )}
    </div>
  );
};

// --- ACCESSIBLE ENGINEERING DOSSIER MODAL ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  eyebrow,
  children,
  maxWidth = '600px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div>
            {eyebrow && <span className="modal-eyebrow">{eyebrow}</span>}
            {title && <h2 className="modal-title font-mono">{title}</h2>}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// --- EMPTY STATE ---
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="empty-state-panel">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};
