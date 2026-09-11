import React, { useState } from 'react';
import { X, Plus, Trash2, Code2, Check, Filter } from 'lucide-react';
import { FilterAST, FilterCondition, FilterOperator } from '../types';
import { astToSqlString, useMockStore } from '../data/mockStore';

interface FilterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIELD_OPTIONS = [
  { value: 'channel', label: 'Channel', type: 'select', options: ['whatsapp', 'sms', 'email', 'webchat'] },
  { value: 'status', label: 'Status', type: 'select', options: ['ai_active', 'human_assigned', 'escalated', 'resolved'] },
  { value: 'sentiment', label: 'Sentiment', type: 'select', options: ['positive', 'neutral', 'negative'] },
  { value: 'priority', label: 'Priority', type: 'select', options: ['low', 'normal', 'high', 'urgent'] },
  { value: 'unread_count', label: 'Unread Count', type: 'number' },
  { value: 'lead_score', label: 'Lead Score', type: 'number' },
];

export const FilterBuilderModal: React.FC<FilterBuilderModalProps> = ({ isOpen, onClose }) => {
  const store = useMockStore();

  const [filterName, setFilterName] = useState('Custom Compound Filter');
  const [operator, setOperator] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<FilterCondition[]>([
    { id: 'c-1', field: 'channel', operator: 'eq', value: 'whatsapp' },
    { id: 'c-2', field: 'sentiment', operator: 'eq', value: 'negative' },
  ]);

  if (!isOpen) return null;

  const currentAST: FilterAST = {
    id: 'custom-ast-group',
    operator,
    conditions,
  };

  const sqlString = astToSqlString(currentAST);

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: `c-${Date.now()}`, field: 'status', operator: 'eq', value: 'ai_active' },
    ]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length <= 1) return;
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleApply = () => {
    store.setAppliedAST(currentAST, filterName);
    onClose();
  };

  const handleSaveAndApply = () => {
    store.addSavedFilter(filterName, currentAST);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card animate-fade-in">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Filter size={18} color="var(--orange-500)" />
            <span>Visual Compound Filter Builder (SQL AST)</span>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Filter Preset Name
            </label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="search-input"
              style={{ paddingLeft: '12px' }}
            />
          </div>

          {/* Logic Group Header */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '12px 14px', 
              background: 'var(--bg-surface-elevated)', 
              borderRadius: '8px', 
              marginBottom: '14px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff' }}>
              Match {operator === 'AND' ? 'ALL of the following' : 'ANY of the following'}:
            </span>
            <div style={{ display: 'flex', background: 'var(--bg-app)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setOperator('AND')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: operator === 'AND' ? 'var(--orange-600)' : 'transparent',
                  color: operator === 'AND' ? '#fff' : 'var(--text-muted)',
                }}
              >
                AND
              </button>
              <button
                type="button"
                onClick={() => setOperator('OR')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: operator === 'OR' ? 'var(--orange-600)' : 'transparent',
                  color: operator === 'OR' ? '#fff' : 'var(--text-muted)',
                }}
              >
                OR
              </button>
            </div>
          </div>

          {/* Condition Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {conditions.map((cond, index) => {
              const fieldDef = FIELD_OPTIONS.find((f) => f.value === cond.field) || FIELD_OPTIONS[0];

              return (
                <div 
                  key={cond.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px',
                    background: 'var(--bg-app)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '20px' }}>
                    {index + 1}.
                  </span>

                  {/* Field Selector */}
                  <select
                    value={cond.field}
                    onChange={(e) => {
                      const newField = e.target.value;
                      const def = FIELD_OPTIONS.find((f) => f.value === newField);
                      const defaultVal = def?.options ? def.options[0] : 0;
                      updateCondition(cond.id, { field: newField, value: defaultVal });
                    }}
                    style={{
                      background: 'var(--bg-surface)',
                      color: '#fff',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  >
                    {FIELD_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>

                  {/* Operator */}
                  <select
                    value={cond.operator}
                    onChange={(e) => updateCondition(cond.id, { operator: e.target.value as FilterOperator })}
                    style={{
                      background: 'var(--bg-surface)',
                      color: '#fff',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  >
                    <option value="eq">equals (=)</option>
                    <option value="neq">not equals (!=)</option>
                    <option value="contains">contains</option>
                    <option value="gt">greater than (&gt;)</option>
                    <option value="lt">less than (&lt;)</option>
                  </select>

                  {/* Value Input */}
                  {fieldDef.options ? (
                    <select
                      value={String(cond.value)}
                      onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                      style={{
                        flex: 1,
                        background: 'var(--bg-surface)',
                        color: '#fff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    >
                      {fieldDef.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={typeof cond.value === 'number' ? cond.value : (Number(cond.value) || 0)}
                      onChange={(e) => updateCondition(cond.id, { value: Number(e.target.value) })}
                      style={{
                        flex: 1,
                        background: 'var(--bg-surface)',
                        color: '#fff',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => removeCondition(cond.id)}
                    className="btn-ghost"
                    style={{ padding: '6px', color: 'var(--rose-500)' }}
                    title="Remove condition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addCondition}
            className="btn-secondary"
            style={{ fontSize: '12px', width: '100%', justifyContent: 'center', marginBottom: '18px' }}
          >
            <Plus size={14} />
            <span>Add Condition</span>
          </button>

          {/* Compiled SQL Preview */}
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Code2 size={14} color="var(--orange-500)" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Safe Parameterized SQL Compilation
              </span>
            </div>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#fdba74', display: 'block', wordBreak: 'break-all' }}>
              {sqlString}
            </code>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-secondary" onClick={handleApply}>
            Apply Filter
          </button>
          <button className="btn-primary" onClick={handleSaveAndApply}>
            <Check size={14} />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
