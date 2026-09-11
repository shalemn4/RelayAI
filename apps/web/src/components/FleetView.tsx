import React from 'react';
import { Bot, Cpu } from 'lucide-react';
import { useMockStore } from '../data/mockStore';

export const FleetView: React.FC = () => {
  const store = useMockStore();

  return (
    <div className="animate-fade-in" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(20, 20, 24, 0.6) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
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
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--violet-500)', letterSpacing: '0.5px' }}>
              Autonomous Agent Orchestration
            </span>
            <span className="live-pill" style={{ padding: '2px 8px', fontSize: '10.5px' }}>
              <span className="live-dot" />
              4 / 4 ONLINE
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
            AI Agent Fleet Telemetry
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.5 }}>
            Each agent utilizes hybrid foundation models with custom tool-calling, semantic vector knowledge bases, and strict confidence bounds.
          </p>
        </div>
      </div>

      {/* Agents Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {store.agents.map((agent) => (
          <div
            key={agent.id}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div 
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(234, 88, 12, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--orange-500)',
                      border: '1px solid rgba(234, 88, 12, 0.25)',
                    }}
                  >
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{agent.name}</h3>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{agent.role}</span>
                  </div>
                </div>

                <span 
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: agent.status === 'online' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: agent.status === 'online' ? 'var(--green-500)' : 'var(--amber-500)',
                    border: `1px solid ${agent.status === 'online' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  }}
                >
                  {agent.status}
                </span>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
                {agent.description}
              </p>
            </div>

            <div>
              {/* Metrics */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  background: 'var(--bg-app)',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '14px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                    {agent.conversations_handled}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Conversations</div>
                </div>

                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--green-500)' }}>
                    {(agent.avg_confidence * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Confidence</div>
                </div>

                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--orange-500)' }}>
                    {(agent.takeover_rate * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Handoff</div>
                </div>
              </div>

              {/* Model Info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Cpu size={13} color="var(--violet-500)" />
                  <span>Model: <strong>{agent.model}</strong></span>
                </div>
                <span style={{ color: 'var(--orange-500)', fontWeight: 600 }}>Active Fleet Unit</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
