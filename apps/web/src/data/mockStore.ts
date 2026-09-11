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
  INITIAL_SUGGESTIONS,
  SUGGESTION_VARIANTS,
  INITIAL_LEADS,
  INITIAL_CALLS,
  SIMULATED_CALL_UTTERANCES,
  INITIAL_AGENTS, 
  INITIAL_SAVED_FILTERS 
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
  public calls: Call[] = INITIAL_CALLS;
  public activeCallId: number = 301;
  public agents: AIAgent[] = INITIAL_AGENTS;
  public savedFilters: SavedFilter[] = INITIAL_SAVED_FILTERS;
  public appliedAST: FilterAST | null = null;
  public activeFilterName: string | null = null;

  // Audio and Call Telemetry Simulation
  public isAudioMuted: boolean = false;
  public isMicMuted: boolean = false;
  public isLiveStreaming: boolean = true;
  public isSpeakingAudio: boolean = false;

  // Realtime audio waveform animation simulation
  public waveformBars: number[] = [14, 28, 45, 60, 32, 75, 90, 50, 65, 82, 40, 55, 30, 70, 85, 45];

  public get activeCall(): Call {
    return this.calls.find((c) => c.id === this.activeCallId) || this.calls[0];
  }

  public set activeCall(c: Call) {
    this.calls = this.calls.map((item) => (item.id === c.id ? c : item));
  }

  constructor() {
    // Pulse waveform for live voice call
    setInterval(() => {
      if (this.activeCall && this.activeCall.status !== 'completed' && !this.isAudioMuted) {
        this.waveformBars = Array.from({ length: 16 }, () => Math.floor(Math.random() * 75) + 15);
        this.notify();
      }
    }, 450);

    // Increment duration timer and jitter latency/packet loss for live calls
    setInterval(() => {
      if (this.isLiveStreaming && this.activeCall && this.activeCall.status !== 'completed') {
        const jitterLatency = Math.floor(Math.random() * 15) - 7;
        const baseLatency = this.activeCall.latency_ms || 180;
        const nextLatency = Math.max(120, Math.min(240, baseLatency + jitterLatency));

        this.activeCall = {
          ...this.activeCall,
          duration_seconds: this.activeCall.duration_seconds + 1,
          latency_ms: nextLatency,
        };
        this.notify();
      }
    }, 1000);
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

  private formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  public regenerateSuggestion(conversationId: number, tonePreference?: string) {
    const current = this.suggestions[conversationId];
    if (!current) return;

    // 1. Immediately enter 'generating' state
    this.suggestions[conversationId] = {
      ...current,
      state: 'generating',
    };
    this.notify();

    // 2. Select next variation or tone
    const variants = SUGGESTION_VARIANTS[conversationId] || [
      {
        category: 'Autonomous Adaptive Response',
        tone: 'Executive SLA',
        confidence: 0.98,
        text: `Thank you for your message! Our enterprise platform complies with all stated requirements. Detailed documentation and security attestations are available on our Trust Portal. Let me know if you would like to schedule a technical walkthrough.`,
        reasoning_steps: [
          'Evaluated conversation context against enterprise SLA rules.',
          'Formulated executive response with verified compliance assurance.',
          'Offered direct technical walkthrough schedule.',
        ],
      },
      {
        category: 'Architecture & Diagnostics',
        tone: 'Technical Deep-Dive',
        confidence: 0.96,
        text: `Our engineering telemetry indicates all systems are operating normally. For API integration, verify your request headers contain HMAC signatures with active secondary secrets. Let us know if you need our team on a debugging call.`,
        reasoning_steps: [
          'Inspected real-time API telemetry.',
          'Formulated precise technical guidance for developer teams.',
          'Prepared immediate engineering support option.',
        ],
      },
      {
        category: 'Priority Action',
        tone: 'Action-Oriented',
        confidence: 0.99,
        text: `I have prepared your priority account package and escalated to our dedicated onboarding manager. You can review and confirm directly at: https://app.relayai.com/onboarding. We can have your workflows live within 2 hours.`,
        reasoning_steps: [
          'Identified opportunity for high-velocity conversion.',
          'Generated direct onboarding package link.',
          'Committed to 2-hour implementation SLA.',
        ],
      },
      {
        category: 'Consultative Guidance',
        tone: 'Consultative',
        confidence: 0.95,
        text: `Thanks for reaching out! We would be delighted to assist with your requirements. I have shared full step-by-step documentation to your account email, and our team is standing by to answer any questions.`,
        reasoning_steps: [
          'Crafted warm, empathetic consultative response.',
          'Confirmed automated dispatch of documentation.',
        ],
      },
    ];

    let chosenIdx = 0;
    if (tonePreference) {
      const found = variants.findIndex((v) => v.tone.toLowerCase().includes(tonePreference.toLowerCase()));
      chosenIdx = found >= 0 ? found : 0;
    } else {
      const currentIdx = current.variant_index ? current.variant_index - 1 : 0;
      chosenIdx = (currentIdx + 1) % variants.length;
    }

    const nextVariant = variants[chosenIdx];

    setTimeout(() => {
      this.suggestions[conversationId] = {
        id: `sug-${conversationId}-${Date.now()}`,
        conversation_id: conversationId,
        category: nextVariant.category,
        tone: nextVariant.tone,
        variant_index: chosenIdx + 1,
        total_variants: variants.length,
        confidence: nextVariant.confidence,
        text: nextVariant.text,
        reasoning_steps: nextVariant.reasoning_steps,
        created_at: 'Just now',
        state: 'ready',
      };
      this.notify();
    }, 450);
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

  // --- Voice Call Telemetry Actions ---

  public selectCall(callId: number) {
    this.activeCallId = callId;
    this.notify();
  }

  public toggleAudioMute() {
    this.isAudioMuted = !this.isAudioMuted;
    this.notify();
  }

  public toggleMicMute() {
    this.isMicMuted = !this.isMicMuted;
    this.notify();
  }

  public toggleLiveStreaming() {
    this.isLiveStreaming = !this.isLiveStreaming;
    this.notify();
  }

  public bargeInCall(callId?: number) {
    const targetId = callId || this.activeCallId;
    this.calls = this.calls.map((c) => {
      if (c.id === targetId) {
        const hasGreeting = c.utterances?.some((u) => u.text.includes('[Supervisor Barge-In]'));
        const newUtterances = [...(c.utterances || [])];

        if (!hasGreeting) {
          const firstName = c.customer_name.split(' ')[0];
          newUtterances.push({
            id: `barge-${Date.now()}`,
            call_id: c.id,
            speaker: 'supervisor',
            text: `[Supervisor Barge-In]: Hello ${firstName}, this is ${this.currentUser.name}, operations lead at RelayAI. I'm stepping into the live audio channel to assist directly.`,
            timestamp: this.formatTime(c.duration_seconds),
            sentiment: 'positive',
            confidence: 1.0,
          });
        }

        return {
          ...c,
          status: 'human_takeover',
          agent_name: `${this.currentUser.name} (Live Takeover)`,
          utterances: newUtterances,
        };
      }
      return c;
    });

    // Burst waveform for 1 second
    this.waveformBars = [85, 95, 78, 92, 88, 94, 99, 91, 86, 95, 80, 92, 85, 90, 97, 88];
    this.notify();
  }

  public supervisorSpeak(callId: number, text: string, isWhisper = false) {
    if (!text.trim()) return;

    this.calls = this.calls.map((c) => {
      if (c.id === callId) {
        const newUtterance = {
          id: `sup-${Date.now()}`,
          call_id: c.id,
          speaker: isWhisper ? ('supervisor' as const) : ('agent' as const),
          text: isWhisper ? `[Private Whisper to Agent]: ${text}` : `[Supervisor]: ${text}`,
          timestamp: this.formatTime(c.duration_seconds),
          sentiment: 'positive' as const,
          confidence: 1.0,
          is_whisper: isWhisper,
        };

        return {
          ...c,
          status: 'human_takeover',
          agent_name: `${this.currentUser.name} (Live Takeover)`,
          utterances: [...(c.utterances || []), newUtterance],
        };
      }
      return c;
    });

    // Waveform burst
    this.waveformBars = [90, 80, 95, 88, 92, 75, 98, 89, 94, 86, 90, 95, 82, 88, 91, 85];
    this.notify();
  }

  public returnControlToAI(callId: number) {
    this.calls = this.calls.map((c) => {
      if (c.id === callId) {
        return {
          ...c,
          status: 'ai_speaking',
          agent_name: 'Alex - Voice AI Hub',
          utterances: [
            ...(c.utterances || []),
            {
              id: `handoff-${Date.now()}`,
              call_id: c.id,
              speaker: 'agent' as const,
              text: `[Supervisor Hands Back Control]: Resuming autonomous AI agent telemetry.`,
              timestamp: this.formatTime(c.duration_seconds),
              sentiment: 'positive' as const,
              confidence: 0.99,
            },
          ],
        };
      }
      return c;
    });

    this.notify();
  }

  public simulateNextUtterance(callId: number) {
    const simList = SIMULATED_CALL_UTTERANCES[callId] || [];
    if (simList.length === 0) return;

    this.calls = this.calls.map((c) => {
      if (c.id === callId) {
        const existingCount = c.utterances?.filter((u) => !u.text.includes('[Supervisor')).length || 0;
        const nextUt = simList[existingCount % simList.length];

        return {
          ...c,
          duration_seconds: c.duration_seconds + 8,
          utterances: [
            ...(c.utterances || []),
            {
              id: `sim-${Date.now()}`,
              call_id: c.id,
              speaker: nextUt.speaker,
              text: nextUt.text,
              timestamp: this.formatTime(c.duration_seconds + 8),
              sentiment: nextUt.sentiment,
              intent: nextUt.intent,
              confidence: nextUt.confidence || 0.97,
            },
          ],
        };
      }
      return c;
    });

    this.waveformBars = [70, 85, 60, 90, 82, 95, 78, 88, 75, 92, 80, 85, 70, 88, 94, 80];
    this.notify();
  }

  public endCall(callId: number) {
    this.calls = this.calls.map((c) => {
      if (c.id === callId) {
        return {
          ...c,
          status: 'completed',
          ended_at: 'Just now',
        };
      }
      return c;
    });
    this.notify();
  }

  public restartCall(callId: number) {
    const pristine = INITIAL_CALLS.find((c) => c.id === callId) || INITIAL_CALLS[0];
    this.calls = this.calls.map((c) => (c.id === callId ? JSON.parse(JSON.stringify(pristine)) : c));
    this.notify();
  }

  public resetToDefaults() {
    this.conversations = INITIAL_CONVERSATIONS;
    this.suggestions = INITIAL_SUGGESTIONS;
    this.leads = INITIAL_LEADS;
    this.calls = JSON.parse(JSON.stringify(INITIAL_CALLS));
    this.activeCallId = 301;
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
