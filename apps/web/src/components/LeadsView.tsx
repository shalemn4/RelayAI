import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useMockStore } from '../data/mockStore';
import { LeadStage } from '../types';

export const LeadsView: React.FC = () => {
  const store = useMockStore();
  const [selectedStage, setSelectedStage] = useState<LeadStage | 'all'>('all');

  const filteredLeads = store.leads.filter(
    (l) => selectedStage === 'all' || l.stage === selectedStage
  );

  const totalValue = store.leads.reduce((sum, l) => sum + l.deal_value, 0);
  const wonValue = store.leads.filter((l) => l.stage === 'won').reduce((sum, l) => sum + l.deal_value, 0);

  const STAGES: LeadStage[] = ['new', 'contacted', 'qualified', 'demo', 'won'];

  return (
    <div className="animate-fade-in" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
      {/* Top Banner KPI */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Pipeline Value</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>
            ${totalValue.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--orange-500)', fontWeight: 600 }}>Active Inbound Opportunities</span>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Closed Won Value</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green-500)', margin: '4px 0' }}>
            ${wonValue.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--green-500)', fontWeight: 600 }}>100% Realized Revenue</span>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average AI Intent Score</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>
            85.6 / 100
          </div>
          <span style={{ fontSize: '11px', color: 'var(--blue-500)', fontWeight: 600 }}>High Conversion Propensity</span>
        </div>
      </div>

      {/* Stage Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', overflowX: 'auto' }}>
        <button
          className={`channel-chip ${selectedStage === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedStage('all')}
        >
          ALL STAGES ({store.leads.length})
        </button>
        {STAGES.map((stg) => {
          const count = store.leads.filter((l) => l.stage === stg).length;
          return (
            <button
              key={stg}
              className={`channel-chip ${selectedStage === stg ? 'active' : ''}`}
              onClick={() => setSelectedStage(stg)}
            >
              {stg.toUpperCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* Leads Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.2)', fontSize: '12px', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>COMPANY / CONTACT</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>STAGE</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>DEAL VALUE</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>AI SCORE</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>SOURCE</th>
              <th style={{ padding: '14px 20px', fontWeight: 600 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr 
                key={lead.id}
                style={{ 
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background-color 0.15s',
                }}
                className="conv-item-hover"
              >
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{lead.company}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{lead.customer_name} • {lead.customer_email}</div>
                  {lead.notes && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {lead.notes}
                    </div>
                  )}
                </td>

                <td style={{ padding: '16px 20px' }}>
                  <select
                    value={lead.stage}
                    onChange={(e) => store.updateLeadStage(lead.id, e.target.value as LeadStage)}
                    style={{
                      background: 'var(--bg-app)',
                      color: lead.stage === 'won' ? 'var(--green-500)' : '#fff',
                      border: '1px solid var(--border-muted)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="demo">Demo</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </td>

                <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                  ${lead.deal_value.toLocaleString()}
                </td>

                <td style={{ padding: '16px 20px' }}>
                  <span 
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: lead.score >= 90 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 88, 12, 0.15)',
                      color: lead.score >= 90 ? 'var(--green-500)' : 'var(--orange-500)',
                      border: `1px solid ${lead.score >= 90 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 88, 12, 0.3)'}`,
                    }}
                  >
                    {lead.score} / 100
                  </span>
                </td>

                <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {lead.source}
                </td>

                <td style={{ padding: '16px 20px' }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '11.5px', padding: '5px 10px' }}
                    onClick={() => {
                      const nextStageMap: Record<LeadStage, LeadStage> = {
                        new: 'contacted',
                        contacted: 'qualified',
                        qualified: 'demo',
                        demo: 'proposal',
                        proposal: 'won',
                        won: 'won',
                        lost: 'new',
                      };
                      store.updateLeadStage(lead.id, nextStageMap[lead.stage]);
                    }}
                  >
                    <span>Advance Stage</span>
                    <ChevronRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
