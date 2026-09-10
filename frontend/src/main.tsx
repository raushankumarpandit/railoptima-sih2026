import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

import { User } from './types';
import { PageId, Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/UI';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Planner } from './pages/Planner';
import { Assets } from './pages/Assets';
import { Traffic } from './pages/Traffic';
import { Backlog } from './pages/Backlog';
import { Blocks } from './pages/Blocks';
import { Analytics } from './pages/Analytics';

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [activeFilter, setActiveFilter] = useState<{ section?: string } | undefined>();

  // Restore authenticated session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('railoptima_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('railoptima_user');
      }
    }
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const handleLogout = () => {
    localStorage.removeItem('railoptima_token');
    localStorage.removeItem('railoptima_user');
    setUser(null);
    setCurrentPage('dashboard');
    showToast('Signed out of operations control environment', 'info');
  };

  const handleNavigate = (page: PageId, filter?: { section?: string }) => {
    setActiveFilter(filter);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return (
      <>
        <Login
          onLogin={(u) => {
            setUser(u);
            showToast(`Welcome, ${u.full_name || u.username}. Session verified.`, 'success');
          }}
        />
        {toastMessage && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setToastMessage('')}
          />
        )}
      </>
    );
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* ENTERPRISE RAILWAY OPERATIONS SIDEBAR */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(p) => {
          setActiveFilter(undefined);
          setCurrentPage(p);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      {/* MAIN OPERATIONS WORKSPACE */}
      <div className="app-main-workspace">
        {/* TOP COMMAND HEADER */}
        <Header
          currentPage={currentPage}
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={handleLogout}
        />

        {/* ACTIVE MODULE VIEW */}
        <main className="workspace-content-body" role="main">
          {currentPage === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} />
          )}

          {currentPage === 'planner' && (
            <Planner
              initialSection={activeFilter?.section || 'SEC-001'}
              onToast={showToast}
            />
          )}

          {currentPage === 'assets' && (
            <Assets
              initialFilter={activeFilter}
              onNavigate={handleNavigate}
              onToast={showToast}
            />
          )}

          {currentPage === 'traffic' && <Traffic />}

          {currentPage === 'backlog' && (
            <Backlog onNavigate={handleNavigate} />
          )}

          {currentPage === 'blocks' && (
            <Blocks onNavigate={handleNavigate} />
          )}

          {currentPage === 'analytics' && <Analytics />}
        </main>
      </div>

      {/* TOAST FEEDBACK NOTIFICATIONS */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
