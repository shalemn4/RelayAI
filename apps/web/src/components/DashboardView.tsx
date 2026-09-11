import React from 'react';
import { 
  Bot, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Flame, 
  PhoneCall,
  Sparkles,
  Layers
} from 'lucide-react';
import { useMockStore } from '../data/mockStore';
import { TabType } from './Sidebar';

interface DashboardViewProps {
  setActiveTab: (tab: TabType) => void;
  onSelectConversation: (id: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, onSelectConversation }) => {
  const store = useMockStore();

  const totalUnread = store.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const totalLeadsValue = store.leads.reduce((sum, l) => sum + (l.deal_value || 0), 0);

  return (
    <div className="animate-fade-in" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
      {/* Top Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.15) 0%, rgba(20, 20, 24, 0.6) 100%)',
          border: '1px solid rgba(234, 88, 12, 0.3)',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--orange-500)' }}>
              Operator Command Center
            </span>
            <span style={{ background: 'rgba(234, 88, 12, 0.2)', color: 'var(--orange-500)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
              AI Active
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Good afternoon, {store.currentUser.name}
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '580px', lineHeight: 1.5 }}>
            RelayAI is currently orchestrating 4 autonomous agents across WhatsApp, SMS, WebChat, and Email. 
            There are <strong>{totalUnread} unread customer inquiries</strong> requiring operator oversight.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            id="btn-goto-inbox"
            className="btn-primary" 
            onClick={() => setActiveTab('inbox')}
          >
            <MessageSquare size={16} />
            <span>Open Inbox ({totalUnread})</span>
          </button>
          <button 
            id="btn-goto-calls"
            className="btn-secondary" 
            onClick={() => setActiveTab('calls')}
          >
            <PhoneCall size={16} color="var(--green-500)" />
            <span>Live Voice Stream</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {/* KPI 1: AI Resolution Rate */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>AI Resolution Rate</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-500)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            84.2%
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--green-500)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <ArrowUpRight size={14} />
            <span>+3.4% this week</span>
          </div>
        </div>

        {/* KPI 2: Median Latency */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Median Response Latency</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-500)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            1.4s
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--blue-500)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <span>⚡ Sub-2s SLA target reached</span>
          </div>
        </div>

        {/* KPI 3: Pipeline Value */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Pipeline Volume</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(234, 88, 12, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-500)' }}>
              <Flame size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            ${(totalLeadsValue / 1000).toFixed(0)}k
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--orange-500)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <span>Across {store.leads.length} qualified opportunities</span>
          </div>
        </div>

        {/* KPI 4: Human Takeover */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>Human Takeover Rate</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet-500)' }}>
              <Bot size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: '4px' }}>
            11.8%
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <span>88.2% fully automated</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Conversations & AI Fleet */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: Active Inbound Stream */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--orange-500)" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Live Omnichannel Stream</span>
            </div>
            <button 
              className="btn-ghost"
              onClick={() => setActiveTab('inbox')}
              style={{ fontSize: '11.5px' }}
            >
              View all ({store.conversations.length})
            </button>
          </div>

          <div>
            {store.conversations.slice(0, 4).map((c) => (
              <div 
                key={c.id} 
                onClick={() => {
                  onSelectConversation(c.id);
                  setActiveTab('inbox');
                }}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
                className="conv-item-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <img 
                    src={c.customer.avatar_url} 
                    alt={c.customer.name} 
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff' }}>{c.customer.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• {c.customer.company}</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.last_message_preview}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <span className={`status-badge ${c.status.replace('_', '-')}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {c.channel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Voice Call & Agent Fleet Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Live Call Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={16} color="var(--green-500)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Live Voice Call</span>
              </div>
              <span className="live-pill" style={{ padding: '3px 8px', fontSize: '10.5px' }}>
                <span className="live-dot"></span>
                ACTIVE
              </span>
            </div>

            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
              {store.activeCall.customer_name}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Handling Agent: {store.activeCall.agent_name}
            </div>

            {/* Simulated Live Audio Waveform */}
            <div 
              style={{ 
                background: 'rgba(0, 0, 0, 0.4)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '8px', 
                padding: '10px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                height: '50px',
              }}
            >
              {store.waveformBars.map((height, idx) => (
                <div 
                  key={idx}
                  className="waveform-bar"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>

            <button 
              id="btn-inspect-call"
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setActiveTab('calls')}
            >
              <span>Inspect Call & Audio Transcript</span>
            </button>
          </div>

          {/* Quick Filters AST Presets */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Layers size={16} color="var(--orange-500)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Quick SQL AST Presets</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {store.savedFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    store.setAppliedAST(f.ast, f.name);
                    setActiveTab('inbox');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{f.name}</span>
                  <span style={{ color: 'var(--orange-500)', fontSize: '11px' }}>Apply →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
