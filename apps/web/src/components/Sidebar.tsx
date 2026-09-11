import React from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  Users, 
  PhoneCall, 
  Bot, 
  BarChart3, 
  Settings, 
  Zap,
  ArrowRightLeft
} from 'lucide-react';
import { useMockStore } from '../data/mockStore';
import { INITIAL_USERS } from '../data/mockData';

export type TabType = 'overview' | 'inbox' | 'leads' | 'calls' | 'fleet' | 'analytics' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const store = useMockStore();
  const unreadCount = store.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const toggleUser = () => {
    const nextUser = store.currentUser.id === 1 ? INITIAL_USERS[1] : INITIAL_USERS[0];
    store.switchUser(nextUser);
  };

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge">
          <Zap size={20} fill="white" />
        </div>
        <div>
          <div className="brand-title">
            RelayAI
            <span className="brand-version">v2.4 Web</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            AI Operations Console
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <button
          id="nav-overview"
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={17} />
          <span>Overview</span>
        </button>

        <button
          id="nav-inbox"
          className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          <Inbox size={17} />
          <span>Unified Inbox</span>
          {unreadCount > 0 && (
            <span className="nav-badge orange">{unreadCount}</span>
          )}
        </button>

        <button
          id="nav-leads"
          className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          <Users size={17} />
          <span>Lead Pipeline</span>
          <span className="nav-badge">{store.leads.length}</span>
        </button>

        <button
          id="nav-calls"
          className={`nav-item ${activeTab === 'calls' ? 'active' : ''}`}
          onClick={() => setActiveTab('calls')}
        >
          <PhoneCall size={17} />
          <span>Voice Operations</span>
          <span className="nav-badge" style={{ color: 'var(--green-500)', background: 'rgba(16, 185, 129, 0.15)' }}>LIVE</span>
        </button>

        <button
          id="nav-fleet"
          className={`nav-item ${activeTab === 'fleet' ? 'active' : ''}`}
          onClick={() => setActiveTab('fleet')}
        >
          <Bot size={17} />
          <span>AI Agent Fleet</span>
          <span className="nav-badge">4</span>
        </button>

        <button
          id="nav-analytics"
          className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={17} />
          <span>Analytics</span>
        </button>

        <button
          id="nav-settings"
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={17} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Operator Profile & Switcher */}
      <div className="sidebar-footer">
        <div className="user-card">
          <img 
            src={store.currentUser.avatar_url} 
            alt={store.currentUser.name} 
            className="user-avatar"
          />
          <div className="user-meta">
            <div className="user-name">{store.currentUser.name}</div>
            <div className="user-role">{store.currentUser.role}</div>
          </div>
          <button 
            id="role-toggle-btn"
            className="role-switch-btn" 
            onClick={toggleUser}
            title="Switch Operator / Supervisor Role"
          >
            <ArrowRightLeft size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
};
