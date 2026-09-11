export type Channel = 'sms' | 'whatsapp' | 'email' | 'webchat';

export type ConversationStatus = 'ai_active' | 'human_assigned' | 'escalated' | 'resolved';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export type LeadStage = 'new' | 'contacted' | 'qualified' | 'demo' | 'proposal' | 'won' | 'lost';

export type MessageRole = 'customer' | 'ai' | 'human' | 'system';

export type MessageStatus = 'waiting_to_send' | 'sending' | 'sent' | 'delivered' | 'failed';

export type CallStatus = 
  | 'connecting'
  | 'ai_speaking'
  | 'customer_speaking'
  | 'processing'
  | 'escalating'
  | 'human_takeover'
  | 'completed';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'operator' | 'admin' | 'supervisor';
  avatar_url?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  avatar_url?: string;
  timezone?: string;
  custom_fields?: Record<string, unknown>;
}

export interface Message {
  id: string | number;
  conversation_id: number;
  sender_role: MessageRole;
  sender_name?: string;
  content: string;
  created_at: string;
  status: MessageStatus;
  metadata?: {
    confidence?: number;
    tokens?: number;
    channel?: Channel;
    ai_category?: string;
    reasoning?: string[];
  };
}

export interface Conversation {
  id: number;
  customer_id: number;
  customer: Customer;
  channel: Channel;
  status: ConversationStatus;
  sentiment: Sentiment;
  priority: Priority;
  assigned_agent_id?: number;
  assigned_agent_name?: string;
  assigned_user_id?: number;
  assigned_user_name?: string;
  last_message?: Message;
  last_message_preview?: string;
  last_activity_at: string;
  unread_count: number;
  tags: string[];
  lead_id?: number;
  lead_stage?: LeadStage;
  lead_score?: number;
  messages?: Message[];
}

export interface Lead {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company: string;
  stage: LeadStage;
  score: number;
  deal_value: number;
  source: string;
  owner_id?: number;
  owner_name?: string;
  last_activity_at: string;
  notes?: string;
}

export interface AISuggestion {
  id: string;
  conversation_id: number;
  text: string;
  confidence: number;
  category: string;
  reasoning_steps: string[];
  created_at: string;
  state: 'idle' | 'generating' | 'ready' | 'accepted' | 'rejected' | 'failed' | 'expired';
}

export interface CallUtterance {
  id: string | number;
  call_id: number;
  speaker: 'agent' | 'customer';
  text: string;
  timestamp: string;
  sentiment?: Sentiment;
  intent?: string;
  confidence?: number;
}

export interface Call {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  status: CallStatus;
  duration_seconds: number;
  agent_id: number;
  agent_name: string;
  started_at: string;
  ended_at?: string;
  sentiment: Sentiment;
  intent_summary?: string;
  utterances?: CallUtterance[];
}

export interface AIAgent {
  id: number;
  name: string;
  role: string;
  description: string;
  status: 'online' | 'busy' | 'offline';
  conversations_handled: number;
  avg_confidence: number;
  takeover_rate: number;
  model: string;
}

export type FilterOperator = 
  | 'eq'
  | 'neq'
  | 'contains'
  | 'in'
  | 'gt'
  | 'lt';

export type LogicalOperator = 'AND' | 'OR';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
}

export interface FilterGroup {
  id: string;
  operator: LogicalOperator;
  conditions: (FilterCondition | FilterGroup)[];
}

export type FilterAST = FilterGroup;

export interface SavedFilter {
  id: number;
  name: string;
  ast: FilterAST;
  is_favorite?: boolean;
}
