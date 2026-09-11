import React from 'react';
import { Sparkles, Database } from 'lucide-react';
import { useMockStore } from '../data/mockStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenFilterModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const store = useMockStore();

  return (
    <header className="app-header">
      <div className="header-left">
        <div>
          <h1 className="header-title-text" id="page-heading">{title}</h1>
          {subtitle && (
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* Backend & State Badge */}
        <div 
          className="live-pill" 
          title="RelayAI reactive state is synchronized in-browser with zero external latency"
        >
          <div className="live-dot"></div>
          <span>Realtime In-Memory Hub</span>
        </div>

        {/* Database Status Indicator */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            padding: '5px 10px',
            borderRadius: '6px',
          }}
        >
          <Database size={13} color="var(--orange-500)" />
          <span>AST Compiled Engine</span>
        </div>

        {/* Demo Seed Reset Action */}
        <button
          id="btn-seed-reset"
          className="btn-secondary"
          style={{ fontSize: '12px', padding: '6px 10px' }}
          onClick={() => {
            store.resetToDefaults();
            alert('Reset demo database to fresh initial state!');
          }}
          title="Reload Seed Conversations & AI Suggestions"
        >
          <Sparkles size={14} color="var(--orange-500)" />
          <span>Reset Seed</span>
        </button>
      </div>
    </header>
  );
};
