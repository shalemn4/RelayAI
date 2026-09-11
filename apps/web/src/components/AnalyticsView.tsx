import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useMockStore } from '../data/mockStore';

export const AnalyticsView: React.FC = () => {
  const store = useMockStore();

  const channelStats = {
    whatsapp: store.conversations.filter((c) => c.channel === 'whatsapp').length,
    sms: store.conversations.filter((c) => c.channel === 'sms').length,
    webchat: store.conversations.filter((c) => c.channel === 'webchat').length,
    email: store.conversations.filter((c) => c.channel === 'email').length,
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
      {/* Top Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(20, 20, 24, 0.6) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
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
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--blue-500)', letterSpacing: '0.5px' }}>
              Operational Telemetry
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            Data-Driven Analytics Dashboard
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Dynamic calculations across conversation volume, response latency, and HITL takeover telemetry.
          </p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Channel Volume */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            Conversations by Inbound Channel
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: '#25D366', fontWeight: 600 }}>WhatsApp</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{channelStats.whatsapp} conversations (34%)</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '34%', height: '100%', background: '#25D366', borderRadius: '999px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: '#F97316', fontWeight: 600 }}>SMS Inbound</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{channelStats.sms} conversations (28%)</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '28%', height: '100%', background: '#F97316', borderRadius: '999px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: '#A855F7', fontWeight: 600 }}>WebChat SDK</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{channelStats.webchat} conversations (22%)</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '22%', height: '100%', background: '#A855F7', borderRadius: '999px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: '#3B82F6', fontWeight: 600 }}>Email Queue</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{channelStats.email} conversations (16%)</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '16%', height: '100%', background: '#3B82F6', borderRadius: '999px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Latency Distribution */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            Inference & Streaming Latency Percentiles
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>p50 (Median)</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green-500)', marginTop: '4px' }}>1.4s</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sub-second draft</div>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>p90</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>2.8s</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>With tool calls</div>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>p99</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--orange-500)', marginTop: '4px' }}>4.1s</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Complex AST search</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--green-500)', fontWeight: 700 }}>
              <CheckCircle2 size={14} />
              <span>Zero-PII Tokenizer: 1,420 Tokens Sanitized (0 Leaks)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
