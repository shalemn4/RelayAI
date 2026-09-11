import React from 'react';
import { ShieldCheck, UserCheck, Radio, Mic } from 'lucide-react';
import { useMockStore } from '../data/mockStore';

export const CallsView: React.FC = () => {
  const store = useMockStore();
  const call = store.activeCall;

  return (
    <div className="animate-fade-in" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
      {/* Top Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(20, 20, 24, 0.6) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
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
            <span className="live-pill" style={{ padding: '3px 8px' }}>
              <span className="live-dot" />
              LIVE TELEMETRY STREAM
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              WebRTC Opus 48kHz • 180ms Latency
            </span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            Voice Call with {call.customer_name}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Phone: {call.customer_phone} • Agent: <strong>{call.agent_name}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            id="btn-barge-in"
            className="btn-primary"
            style={{ 
              background: call.status === 'human_takeover' ? 'var(--green-600)' : 'linear-gradient(135deg, #ea580c, #c2410c)',
              gap: '8px',
            }}
            onClick={() => store.bargeInCall()}
          >
            <UserCheck size={16} />
            <span>{call.status === 'human_takeover' ? 'Operator Active in Call' : 'Supervisor Barge-In (Takeover)'}</span>
          </button>
        </div>
      </div>

      {/* Main Call Monitor Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left: Live Speech-to-Text Utterance Timeline */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} color="var(--orange-500)" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Streaming Audio Transcript</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Zero-PII Tokenizer Active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto' }}>
            {call.utterances?.map((ut) => (
              <div 
                key={ut.id}
                style={{
                  background: ut.speaker === 'agent' ? 'rgba(234, 88, 12, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${ut.speaker === 'agent' ? 'rgba(234, 88, 12, 0.25)' : 'var(--border-subtle)'}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: ut.speaker === 'agent' ? 'var(--orange-500)' : '#fff' }}>
                      {ut.speaker === 'agent' ? call.agent_name : call.customer_name}
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>• {ut.timestamp}</span>
                  </div>

                  {ut.confidence && (
                    <span style={{ fontSize: '10px', color: 'var(--green-500)', fontWeight: 700 }}>
                      {(ut.confidence * 100).toFixed(0)}% Match
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                  {ut.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Audio Waveform & Call Telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Waveform Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Mic size={16} color="var(--green-500)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Real-time Frequency Waveform</span>
            </div>

            <div 
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '0 12px',
                marginBottom: '14px',
              }}
            >
              {store.waveformBars.map((val, i) => (
                <div 
                  key={i} 
                  className="waveform-bar" 
                  style={{ height: `${val}%`, width: '5px' }} 
                />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
              <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Audio Packet Loss</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-500)' }}>0.01%</div>
              </div>
              <div style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Sentiment Score</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Positive (0.92)</div>
              </div>
            </div>
          </div>

          {/* Security & Zero-PII */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldCheck size={16} color="var(--orange-500)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Zero-PII Audio Redaction</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              All spoken SSNs, credit card numbers, and banking routing codes are dynamically scrubbed in memory before persisting to the transcript database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
