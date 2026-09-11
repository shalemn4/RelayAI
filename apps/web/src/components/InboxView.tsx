import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Send, 
  Sparkles, 
  Check, 
  X, 
  RotateCcw, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  User as UserIcon,
  MessageCircle,
  Mail,
  Smartphone,
  Globe
} from 'lucide-react';
import { useMockStore, evaluateAST, astToSqlString } from '../data/mockStore';
import { Channel } from '../types';
import { FilterBuilderModal } from './FilterBuilderModal';

interface InboxViewProps {
  selectedConversationId: number | null;
  setSelectedConversationId: (id: number) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  selectedConversationId,
  setSelectedConversationId,
}) => {
  const store = useMockStore();

  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel | 'all'>('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [showReasoning, setShowReasoning] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter conversations
  const filteredConversations = store.conversations.filter((c) => {
    // 1. Channel filter
    if (selectedChannel !== 'all' && c.channel !== selectedChannel) return false;

    // 2. Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.customer.name.toLowerCase().includes(q);
      const matchCompany = c.customer.company.toLowerCase().includes(q);
      const matchMsg = (c.last_message_preview || '').toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchMsg) return false;
    }

    // 3. SQL AST Compound filter
    if (store.appliedAST) {
      if (!evaluateAST(c as unknown as Record<string, unknown>, store.appliedAST)) return false;
    }

    return true;
  });

  const activeConv = store.conversations.find((c) => c.id === selectedConversationId) || filteredConversations[0];
  const activeSuggestion = activeConv ? store.suggestions[activeConv.id] : null;

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages?.length]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!composerText.trim() || !activeConv) return;
    store.sendMessage(activeConv.id, composerText.trim());
    setComposerText('');
  };

  const handleEditSuggestion = (text: string) => {
    setComposerText(text);
  };

  const getChannelIcon = (ch: Channel) => {
    switch (ch) {
      case 'whatsapp': return <MessageCircle size={11} color="#25D366" />;
      case 'sms': return <Smartphone size={11} color="#F97316" />;
      case 'email': return <Mail size={11} color="#3B82F6" />;
      case 'webchat': return <Globe size={11} color="#A855F7" />;
    }
  };

  return (
    <div className="inbox-layout">
      {/* Left Column: Inbound List & AST Controls */}
      <div className="inbox-sidebar">
        {/* Search & Filter Header */}
        <div className="inbox-search-bar">
          <div className="search-input-wrap">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search conversations, customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <button
            id="btn-open-filter-modal"
            className={`filter-builder-btn ${store.appliedAST ? 'active' : ''}`}
            onClick={() => setIsFilterModalOpen(true)}
            title="Open Compound SQL AST Filter Builder"
          >
            <Filter size={14} color={store.appliedAST ? 'var(--orange-500)' : 'currentColor'} />
            <span>AST Filter</span>
          </button>
        </div>

        {/* Channel Selection Chips */}
        <div className="channel-tabs">
          {(['all', 'whatsapp', 'sms', 'webchat', 'email'] as const).map((ch) => (
            <button
              key={ch}
              className={`channel-chip ${selectedChannel === ch ? 'active' : ''}`}
              onClick={() => setSelectedChannel(ch)}
            >
              {ch.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Active AST Filter Banner */}
        {store.appliedAST && (
          <div className="ast-active-banner">
            <div>
              <div>⚡ Filter: {store.activeFilterName || 'Custom AST'}</div>
              <div className="ast-sql-code">{astToSqlString(store.appliedAST)}</div>
            </div>
            <button className="ast-clear-btn" onClick={() => store.clearAppliedAST()}>
              Clear
            </button>
          </div>
        )}

        {/* List of Conversations */}
        <div className="conversation-list">
          {filteredConversations.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Filter size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>No matching conversations</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Try loosening your filter criteria or reset AST.</div>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = activeConv && activeConv.id === c.id;

              return (
                <div
                  key={c.id}
                  id={`conv-item-${c.id}`}
                  className={`conv-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedConversationId(c.id)}
                >
                  <div className="conv-avatar-wrap">
                    <img src={c.customer.avatar_url} alt={c.customer.name} className="conv-avatar" />
                    <div className="conv-channel-icon">{getChannelIcon(c.channel)}</div>
                  </div>

                  <div className="conv-details">
                    <div className="conv-top-row">
                      <span className="conv-name">{c.customer.name}</span>
                      <span className="conv-time">{c.last_activity_at}</span>
                    </div>

                    <div className="conv-preview">{c.last_message_preview}</div>

                    <div className="conv-badges">
                      <span className={`status-badge ${c.status.replace('_', '-')}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                      <span className={`sentiment-dot ${c.sentiment}`} title={`Sentiment: ${c.sentiment}`} />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.customer.company}</span>
                      {c.unread_count > 0 && (
                        <span className="nav-badge orange" style={{ marginLeft: 'auto', padding: '1px 5px', fontSize: '10px' }}>
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Thread View & Hero HITL AI Suggestion Card */}
      {activeConv ? (
        <div className="thread-container">
          {/* Header */}
          <div className="thread-header">
            <div className="customer-info">
              <img src={activeConv.customer.avatar_url} alt={activeConv.customer.name} className="user-avatar" style={{ width: '38px', height: '38px' }} />
              <div>
                <div className="customer-title-row">
                  <span className="customer-name">{activeConv.customer.name}</span>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                    {activeConv.channel}
                  </span>
                </div>
                <span className="customer-company">{activeConv.customer.company} • {activeConv.customer.phone}</span>
              </div>
            </div>

            <div className="thread-actions">
              {/* Takeover Toggle */}
              <div 
                id="takeover-toggle"
                className={`takeover-switch ${activeConv.status === 'ai_active' ? 'ai' : 'human'}`}
                onClick={() => store.toggleTakeover(activeConv.id)}
                title="Toggle between Autonomous AI Triage and Operator Takeover"
              >
                <div className={`takeover-pill ${activeConv.status === 'ai_active' ? 'active ai' : 'inactive'}`}>
                  🤖 AI Active
                </div>
                <div className={`takeover-pill ${activeConv.status === 'human_assigned' ? 'active human' : 'inactive'}`}>
                  👤 Human Takeover
                </div>
              </div>
            </div>
          </div>

          {/* Message Timeline */}
          <div className="messages-timeline">
            {activeConv.messages?.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender_role}`}>
                <div className="message-sender">
                  {msg.sender_role === 'ai' ? <Bot size={13} color="var(--orange-500)" /> : <UserIcon size={13} />}
                  <span>{msg.sender_name || (msg.sender_role === 'customer' ? activeConv.customer.name : 'Operator')}</span>
                </div>
                <div className="message-bubble">{msg.content}</div>
                <div className="message-meta">
                  <span>{msg.created_at}</span>
                  {msg.status && <span>• {msg.status}</span>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Hero HITL AI Suggestion Card */}
          {activeSuggestion && (activeSuggestion.state === 'ready' || activeSuggestion.state === 'generating') && (
            <div className="ai-suggestion-box animate-fade-in" style={{ position: 'relative' }}>
              {activeSuggestion.state === 'generating' ? (
                <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Sparkles size={20} color="var(--orange-500)" className="animate-spin" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                      Claude 3.5 Sonnet is synthesizing a fresh draft...
                    </span>
                  </div>
                  <div style={{ width: '100%', maxWidth: '400px', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, var(--orange-500), var(--green-500))', borderRadius: '4px' }} />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Applying enterprise tone constraints & compliance verification rules...
                  </span>
                </div>
              ) : (
                <>
                  <div className="sug-header">
                    <div className="sug-title-badge" style={{ gap: '8px', flexWrap: 'wrap' }}>
                      <Sparkles size={16} />
                      <span>AI Suggested Response</span>
                      {activeSuggestion.tone && (
                        <span style={{ fontSize: '10.5px', background: 'rgba(234, 88, 12, 0.2)', border: '1px solid rgba(234, 88, 12, 0.4)', padding: '2px 7px', borderRadius: '12px', color: 'var(--orange-500)', fontWeight: 700 }}>
                          {activeSuggestion.tone}
                        </span>
                      )}
                      {activeSuggestion.variant_index && (
                        <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '8px', color: 'var(--text-muted)' }}>
                          Variant {activeSuggestion.variant_index} of {activeSuggestion.total_variants || 4}
                        </span>
                      )}
                    </div>
                    <div className="confidence-gauge">
                      <span>{(activeSuggestion.confidence * 100).toFixed(0)}% High Confidence</span>
                    </div>
                  </div>

                  {/* Quick Tone Switcher Pills */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '4px' }}>Regenerate as:</span>
                    {['Executive Tone', 'Technical Deep-Dive', 'Fast-Track', 'Consultative'].map((toneName) => (
                      <button
                        key={toneName}
                        type="button"
                        className="btn-ghost"
                        style={{
                          fontSize: '11px',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          background: activeSuggestion.tone === toneName ? 'rgba(234, 88, 12, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          borderColor: activeSuggestion.tone === toneName ? 'var(--orange-500)' : 'var(--border-subtle)',
                          color: activeSuggestion.tone === toneName ? 'var(--orange-500)' : 'var(--text-secondary)',
                        }}
                        onClick={() => store.regenerateSuggestion(activeConv.id, toneName)}
                      >
                        {toneName.replace(' Tone', '')}
                      </button>
                    ))}
                  </div>

                  <div className="sug-text">{activeSuggestion.text}</div>

                  {/* Collapsible Reasoning Trace */}
                  <button 
                    className="sug-reasoning-toggle" 
                    onClick={() => setShowReasoning(!showReasoning)}
                  >
                    {showReasoning ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    <span>{showReasoning ? 'Hide Reasoning Steps' : 'View AI Reasoning Trace'}</span>
                  </button>

                  {showReasoning && (
                    <div className="sug-reasoning-list animate-fade-in">
                      {activeSuggestion.reasoning_steps.map((step, idx) => (
                        <div key={idx}>• {step}</div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="sug-actions">
                    <button 
                      id="btn-accept-suggestion"
                      className="btn-accept" 
                      onClick={() => store.acceptSuggestion(activeConv.id)}
                    >
                      <Check size={14} />
                      <span>Accept & Send</span>
                    </button>
                    <button 
                      className="btn-ghost" 
                      onClick={() => handleEditSuggestion(activeSuggestion.text)}
                      title="Copy into composer to edit before sending"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button 
                      id="btn-regenerate-suggestion"
                      className="btn-ghost" 
                      onClick={() => store.regenerateSuggestion(activeConv.id)}
                      title="Generate alternative response with Claude 3.5 Sonnet"
                      style={{ gap: '6px' }}
                    >
                      <RotateCcw size={13} />
                      <span>Regenerate ({activeSuggestion.variant_index || 1}/{activeSuggestion.total_variants || 4})</span>
                    </button>
                    <button 
                      className="btn-ghost" 
                      onClick={() => store.rejectSuggestion(activeConv.id)}
                      style={{ color: 'var(--rose-500)', marginLeft: 'auto' }}
                      title="Reject and dismiss suggestion"
                    >
                      <X size={13} />
                      <span>Reject</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Fallback button when suggestion is rejected or accepted */}
          {(!activeSuggestion || activeSuggestion.state === 'rejected' || activeSuggestion.state === 'accepted') && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ 
                  fontSize: '12px', 
                  gap: '6px', 
                  color: 'var(--orange-500)', 
                  border: '1px solid rgba(234, 88, 12, 0.3)',
                  background: 'rgba(234, 88, 12, 0.05)',
                }}
                onClick={() => store.regenerateSuggestion(activeConv.id)}
              >
                <Sparkles size={14} />
                <span>✨ Generate New AI Draft</span>
              </button>
            </div>
          )}

          {/* Composer */}
          <form className="thread-composer" onSubmit={handleSendMessage}>
            <textarea
              id="composer-input"
              rows={1}
              className="composer-input"
              placeholder={`Reply to ${activeConv.customer.name} via ${activeConv.channel.toUpperCase()}... (Press Enter to Send)`}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button 
              type="submit" 
              id="btn-send-message"
              className="btn-primary" 
              style={{ padding: '10px 16px', height: '44px' }}
              disabled={!composerText.trim()}
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </form>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Select a conversation from the left to view messages.
        </div>
      )}

      {/* Filter Builder Modal */}
      <FilterBuilderModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />
    </div>
  );
};
