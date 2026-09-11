import { useState, useEffect } from 'react';
import { 
  User, 
  Conversation, 
  Lead, 
  Call, 
  AIAgent, 
  SavedFilter, 
  AISuggestion, 
  FilterAST,
  FilterCondition,
  LeadStage,
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_CONVERSATIONS, 
  INITIAL_LEADS, 
  INITIAL_CALL, 
  INITIAL_AGENTS, 
  INITIAL_SAVED_FILTERS, 
  INITIAL_SUGGESTIONS 
} from './mockData';

// ---------------------------------------------------------------------------
// SQL AST IN-MEMORY EVALUATOR
// ---------------------------------------------------------------------------
export function evaluateCondition(item: Record<string, unknown>, condition: FilterCondition): boolean {
  const val = item[condition.field];
  const target = condition.value;

  switch (condition.operator) {
    case 'eq':
      return String(val).toLowerCase() === String(target).toLowerCase();
    case 'neq':
      return String(val).toLowerCase() !== String(target).toLowerCase();
    case 'contains':
      return String(val ?? '').toLowerCase().includes(String(target).toLowerCase());
    case 'gt':
      return Number(val) > Number(target);
    case 'lt':
      return Number(val) < Number(target);
    default:
      return true;
  }
}

export function evaluateAST(item: Record<string, unknown>, ast: FilterAST | null): boolean {
  if (!ast || !ast.conditions || ast.conditions.length === 0) return true;

  if (ast.operator === 'AND') {
    return ast.conditions.every((child) => {
      if ('operator' in child && 'conditions' in child) {
        return evaluateAST(item, child as FilterAST);
      }
      return evaluateCondition(item, child as FilterCondition);
    });
  } else {
    return ast.conditions.some((child) => {
      if ('operator' in child && 'conditions' in child) {
        return evaluateAST(item, child as FilterAST);
      }
      return evaluateCondition(item, child as FilterCondition);
    });
  }
}

export function astToSqlString(ast: FilterAST | null): string {
  if (!ast || !ast.conditions || ast.conditions.length === 0) {
    return 'SELECT * FROM conversations';
  }

  const renderChild = (child: FilterCondition | FilterAST): string => {
    if ('operator' in child && 'conditions' in child) {
      const inner = (child as FilterAST).conditions.map(renderChild).join(` ${(child as FilterAST).operator} `);
      return `(${inner})`;
    }
    const c = child as FilterCondition;
    const opMap: Record<string, string> = {
      eq: '=',
      neq: '!=',
      contains: 'LIKE',
      gt: '>',
      lt: '<',
    };
    const sqlOp = opMap[c.operator] || '=';
    const val = typeof c.value === 'string' ? `'${c.value}'` : c.value;
    return `${c.field} ${sqlOp} ${val}`;
  };

  const whereClause = ast.conditions.map(renderChild).join(` ${ast.operator} `);
  return `SELECT * FROM conversations WHERE ${whereClause}`;
}

// ---------------------------------------------------------------------------
// GLOBAL STORE SINGLETON
// ---------------------------------------------------------------------------
class MockStore {
  private listeners: Set<() => void> = new Set();
  
  public currentUser: User = INITIAL_USERS[0];
  public conversations: Conversation[] = INITIAL_CONVERSATIONS;
  public suggestions: Record<number, AISuggestion> = INITIAL_SUGGESTIONS;
  public leads: Lead[] = INITIAL_LEADS;
  public activeCall: Call = INITIAL_CALL;
  public agents: AIAgent[] = INITIAL_AGENTS;
  public savedFilters: SavedFilter[] = INITIAL_SAVED_FILTERS;
  public appliedAST: FilterAST | null = null;
  public activeFilterName: string | null = null;

  // Realtime audio waveform animation simulation
  public waveformBars: number[] = [14, 28, 45, 60, 32, 75, 90, 50, 65, 82, 40, 55, 30, 70, 85, 45];

  constructor() {
    // Pulse waveform for live voice call
    setInterval(() => {
      if (this.activeCall.status !== 'completed') {
        this.waveformBars = Array.from({ length: 16 }, () => Math.floor(Math.random() * 75) + 15);
        this.notify();
      }
    }, 450);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // --- Actions ---

  public switchUser(user: User) {
    this.currentUser = user;
    this.notify();
  }

  public setAppliedAST(ast: FilterAST | null, name: string | null = null) {
    this.appliedAST = ast;
    this.activeFilterName = name;
    this.notify();
  }

  public clearAppliedAST() {
    this.appliedAST = null;
    this.activeFilterName = null;
    this.notify();
  }

  public addSavedFilter(name: string, ast: FilterAST) {
    const newFilter: SavedFilter = {
      id: Date.now(),
      name,
      ast,
      is_favorite: true,
    };
    this.savedFilters = [...this.savedFilters, newFilter];
    this.appliedAST = ast;
    this.activeFilterName = name;
    this.notify();
  }

  public toggleTakeover(conversationId: number) {
    this.conversations = this.conversations.map((c) => {
      if (c.id === conversationId) {
        const newStatus = c.status === 'ai_active' ? 'human_assigned' : 'ai_active';
        return {
          ...c,
          status: newStatus,
          assigned_user_name: newStatus === 'human_assigned' ? this.currentUser.name : undefined,
        };
      }
      return c;
    });
    this.notify();
  }

  public acceptSuggestion(conversationId: number) {
    const sug = this.suggestions[conversationId];
    if (!sug) return;

    // 1. Add AI message to conversation
    const newMsg = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_role: 'ai' as const,
      sender_name: `${this.currentUser.name} (Approved AI)`,
      content: sug.text,
      created_at: 'Just now',
      status: 'delivered' as const,
      metadata: {
        confidence: sug.confidence,
        ai_category: sug.category,
        reasoning: sug.reasoning_steps,
      },
    };

    this.conversations = this.conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          last_activity_at: 'Just now',
          last_message_preview: sug.text,
          unread_count: 0,
          messages: [...(c.messages || []), newMsg],
        };
      }
      return c;
    });

    // 2. Mark suggestion accepted
    this.suggestions[conversationId] = {
      ...sug,
      state: 'accepted',
    };

    this.notify();
  }

  public rejectSuggestion(conversationId: number) {
    const sug = this.suggestions[conversationId];
    if (!sug) return;
    this.suggestions[conversationId] = {
      ...sug,
      state: 'rejected',
    };
    this.notify();
  }

  public regenerateSuggestion(conversationId: number) {
    const current = this.suggestions[conversationId];
    this.suggestions[conversationId] = {
      ...current,
      state: 'generating',
    };
    this.notify();

    setTimeout(() => {
      this.suggestions[conversationId] = {
        id: `sug-${Date.now()}`,
        conversation_id: conversationId,
        category: 'Autonomous Adaptive Response',
        confidence: 0.97,
        text: `Alternative Response: Thank you for following up! Our enterprise compliance engineers have certified this workflow, and full documentation is available instantly on our dedicated security portal. Let me know if you would like me to schedule a technical walkthrough.`,
        reasoning_steps: [
          'Regenerated alternative reply with higher executive tone.',
          'Integrated direct portal link and customer success contact information.',
          'Cross-referenced security validation rules.',
        ],
        created_at: 'Just now',
        state: 'ready',
      };
      this.notify();
    }, 600);
  }

  public sendMessage(conversationId: number, content: string) {
    if (!content.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_role: 'human' as const,
      sender_name: this.currentUser.name,
      content,
      created_at: 'Just now',
      status: 'delivered' as const,
    };

    this.conversations = this.conversations.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          last_activity_at: 'Just now',
          last_message_preview: content,
          status: 'human_assigned',
          assigned_user_name: this.currentUser.name,
          unread_count: 0,
          messages: [...(c.messages || []), newMsg],
        };
      }
      return c;
    });

    this.notify();
  }

  public updateLeadStage(leadId: number, stage: LeadStage) {
    this.leads = this.leads.map((l) => (l.id === leadId ? { ...l, stage } : l));
    this.notify();
  }

  public bargeInCall() {
    this.activeCall = {
      ...this.activeCall,
      status: 'human_takeover',
      agent_name: `${this.currentUser.name} (Live Takeover)`,
      utterances: [
        ...(this.activeCall.utterances || []),
        {
          id: Date.now(),
          call_id: this.activeCall.id,
          speaker: 'agent',
          text: `[Supervisor Barge-In]: Hello Sarah, this is ${this.currentUser.name}, operations lead at RelayAI. I'm stepping in to assist directly.`,
          timestamp: '01:35',
          sentiment: 'positive',
          confidence: 1.0,
        },
      ],
    };
    this.notify();
  }

  public resetToDefaults() {
    this.conversations = INITIAL_CONVERSATIONS;
    this.suggestions = INITIAL_SUGGESTIONS;
    this.leads = INITIAL_LEADS;
    this.activeCall = INITIAL_CALL;
    this.appliedAST = null;
    this.activeFilterName = null;
    this.notify();
  }
}

export const mockStore = new MockStore();

// React Hook to consume store
export function useMockStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    return mockStore.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  return mockStore;
}
