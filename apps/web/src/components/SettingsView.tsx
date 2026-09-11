import React, { useState } from 'react';
import { Server, Shield, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMockStore } from '../data/mockStore';
import { INITIAL_USERS } from '../data/mockData';

export const SettingsView: React.FC = () => {
  const store = useMockStore();

  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  const testBackend = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const cleanUrl = backendUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/health`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          status: 'success',
          message: `Connected successfully to FastAPI backend! (${data.service || 'RelayAI API'})`,
        });
      } else {
        setTestResult({
          status: 'error',
          message: `Backend returned HTTP ${res.status}. Verify endpoint route.`,
        });
      }
    } catch {
      setTestResult({
        status: 'error',
        message: `Failed to connect to ${backendUrl}. Ensure uvicorn server is running with CORS enabled.`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
      <div 
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
          Platform Settings & Environment Diagnostics
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Manage backend connection modes, test real-time endpoints, and inspect session credentials.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Backend Configuration Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Server size={18} color="var(--orange-500)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>FastAPI Backend Connection</h3>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
            RelayAI runs seamlessly in <strong>Standalone In-Memory Mode</strong> on Vercel without requiring an active backend. To connect a live FastAPI instance (e.g. on Render or local):
          </p>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Backend Service URL
            </label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '12px' }}
              placeholder="http://localhost:8000"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <button 
              id="btn-test-backend"
              className="btn-primary" 
              onClick={testBackend}
              disabled={testingConnection}
              style={{ fontSize: '12px' }}
            >
              <RefreshCw size={14} className={testingConnection ? 'animate-spin' : ''} />
              <span>{testingConnection ? 'Testing...' : 'Test Backend Health'}</span>
            </button>
          </div>

          {testResult && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: testResult.status === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                border: `1px solid ${testResult.status === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                color: testResult.status === 'success' ? 'var(--green-500)' : 'var(--rose-500)',
              }}
            >
              {testResult.status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Operator Credentials Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={18} color="var(--blue-500)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Active Operator Session</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-app)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
            <img src={store.currentUser.avatar_url} alt={store.currentUser.name} style={{ width: '42px', height: '42px', borderRadius: '50%' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{store.currentUser.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{store.currentUser.email} • Role: <strong>{store.currentUser.role}</strong></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {INITIAL_USERS.map((u) => (
              <button
                key={u.id}
                className={`btn-secondary ${store.currentUser.id === u.id ? 'active' : ''}`}
                style={{
                  flex: 1,
                  fontSize: '12px',
                  borderColor: store.currentUser.id === u.id ? 'var(--orange-500)' : undefined,
                  background: store.currentUser.id === u.id ? 'rgba(234, 88, 12, 0.1)' : undefined,
                  color: store.currentUser.id === u.id ? '#fff' : undefined,
                }}
                onClick={() => store.switchUser(u)}
              >
                <span>Switch to {u.role === 'operator' ? 'Jordan (Operator)' : 'Morgan (Supervisor)'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
