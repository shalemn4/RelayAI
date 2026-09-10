import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Conversation, Lead, Call } from '@relay-ai/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

interface SpotlightSearchModalProps {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  action: () => void;
}

export const SpotlightSearchModal: React.FC<SpotlightSearchModalProps> = ({
  visible,
  onClose,
  initialQuery = '',
}) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (visible) {
      setQuery(initialQuery);
    }
  }, [visible, initialQuery]);

  // Global keydown listener for Escape
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  // 1. Fetch live conversations
  const { data: convData, isLoading: isLoadingConvs } = useQuery<{ items: Conversation[] }>({
    queryKey: ['spotlight-conversations', query],
    queryFn: async () => {
      const res = await api.get('/conversations', {
        params: { search: query.trim() || undefined, limit: 4 },
      });
      return res.data;
    },
    enabled: visible,
  });

  // 2. Fetch live leads
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ['spotlight-leads', query],
    queryFn: async () => {
      const res = await api.get('/leads', {
        params: { search: query.trim() || undefined },
      });
      return res.data.slice(0, 4);
    },
    enabled: visible,
  });

  // 3. Fetch live calls
  const { data: calls = [], isLoading: isLoadingCalls } = useQuery<Call[]>({
    queryKey: ['spotlight-calls'],
    queryFn: async () => {
      const res = await api.get('/calls');
      return res.data;
    },
    enabled: visible,
  });

  const filteredCalls = useMemo(() => {
    if (!query.trim()) return calls.slice(0, 3);
    const q = query.toLowerCase();
    return calls
      .filter(
        (c) =>
          c.customer_name.toLowerCase().includes(q) ||
          c.customer_phone.includes(q) ||
          c.status.toLowerCase().includes(q)
      )
      .slice(0, 3);
  }, [calls, query]);

  // Quick navigation actions
  const quickActions: QuickAction[] = [
    {
      id: 'dash',
      title: 'Dashboard Overview',
      subtitle: 'Executive bento metrics, meeting calendars, and agent matrix',
      icon: '⚡',
      badge: 'Overview',
      action: () => {
        router.push('/(tabs)/dashboard');
        onClose();
      },
    },
    {
      id: 'inbox',
      title: 'Unified Inbox',
      subtitle: 'Multi-channel customer chats, AI triage & reply suggestions',
      icon: '📥',
      badge: '50 Total',
      action: () => {
        router.push('/(tabs)/inbox');
        onClose();
      },
    },
    {
      id: 'leads',
      title: 'Lead Pipeline & Directory',
      subtitle: 'Deal stages, pipeline volume, and bulk status transitions',
      icon: '🎯',
      badge: '20 Leads',
      action: () => {
        router.push('/(tabs)/leads');
        onClose();
      },
    },
    {
      id: 'calls',
      title: 'Voice AI Telemetry & Transcripts',
      subtitle: 'Live caller speech turns, sentiment analysis, supervisor takeover',
      icon: '🎙️',
      badge: 'Live Audio',
      action: () => {
        router.push('/(tabs)/calls');
        onClose();
      },
    },
    {
      id: 'analytics',
      title: 'Product & Operational Analytics',
      subtitle: 'Data-driven SQL metrics, AI acceptance, turn volume breakdown',
      icon: '📊',
      badge: 'SQL Engine',
      action: () => {
        router.push('/(tabs)/analytics');
        onClose();
      },
    },
    {
      id: 'agents',
      title: 'AI Agent Fleet Status',
      subtitle: 'Monitor active triage bots, confidence scores, human takeover',
      icon: '🤖',
      badge: '5 Agents',
      action: () => {
        router.push('/(tabs)/agents');
        onClose();
      },
    },
  ];

  const filteredActions = useMemo(() => {
    if (!query.trim()) return quickActions.slice(0, 4);
    const q = query.toLowerCase();
    return quickActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );
  }, [query]);

  const conversations = convData?.items || [];
  const isLoading = isLoadingConvs || isLoadingLeads || isLoadingCalls;

  const handleSelectConversation = (conv: Conversation) => {
    router.push(`/(tabs)/inbox/${conv.id}`);
    onClose();
  };

  const handleSelectLead = (lead: Lead) => {
    router.push('/(tabs)/leads');
    onClose();
  };

  const handleSelectCall = (call: Call) => {
    router.push('/(tabs)/calls');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.backdrop}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={styles.paletteCard}
        >
          {/* Top Search Bar */}
          <View style={styles.searchHeader}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations, leads, calls, or type an action..."
              placeholderTextColor={COLORS.textSubtle}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query ? (
              <TouchableOpacity
                onPress={() => setQuery('')}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={onClose} style={styles.escBadge}>
              <Text style={styles.escBadgeText}>ESC</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Presets / Tags */}
          <View style={styles.presetsRow}>
            <Text style={styles.presetsLabel}>SUGGESTIONS:</Text>
            {['Carlos Mendoza', 'Rachel Green', 'Enterprise Leads', 'Voice AI'].map((preset) => (
              <TouchableOpacity
                key={preset}
                onPress={() => setQuery(preset)}
                style={styles.presetChip}
              >
                <Text style={styles.presetChipText}>{preset}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Results List */}
          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={styles.loadingText}>Searching RelayAI ecosystem...</Text>
              </View>
            ) : null}

            {/* Quick Actions & Navigation */}
            {filteredActions.length > 0 ? (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>⚡ NAVIGATION & ACTIONS</Text>
                {filteredActions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    activeOpacity={0.7}
                    onPress={action.action}
                    style={styles.resultItem}
                  >
                    <View style={styles.actionIconBox}>
                      <Text style={styles.actionIconText}>{action.icon}</Text>
                    </View>
                    <View style={styles.resultMain}>
                      <Text style={styles.resultTitle}>{action.title}</Text>
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {action.subtitle}
                      </Text>
                    </View>
                    {action.badge ? (
                      <View style={styles.badgePill}>
                        <Text style={styles.badgePillText}>{action.badge}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.arrowIcon}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Conversations Results */}
            {conversations.length > 0 ? (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>💬 CONVERSATIONS ({conversations.length})</Text>
                {conversations.map((conv) => (
                  <TouchableOpacity
                    key={conv.id}
                    activeOpacity={0.7}
                    onPress={() => handleSelectConversation(conv)}
                    style={styles.resultItem}
                  >
                    <View style={styles.convAvatar}>
                      <Text style={styles.convAvatarText}>
                        {(conv.customer?.name || 'Customer').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.resultMain}>
                      <View style={styles.titleWithMeta}>
                        <Text style={styles.resultTitle}>{conv.customer?.name || 'Customer'}</Text>
                        <Text style={styles.resultCompany}>• {conv.customer?.company || 'Company'}</Text>
                      </View>
                      <Text style={styles.resultSnippet} numberOfLines={1}>
                        {conv.last_message_preview || conv.last_message?.content || 'No messages yet'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.channelBadge,
                        conv.channel === 'whatsapp' && styles.whatsappBadge,
                        conv.channel === 'sms' && styles.smsBadge,
                      ]}
                    >
                      <Text style={styles.channelBadgeText}>{conv.channel.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.arrowIcon}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Leads Results */}
            {leads.length > 0 ? (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>🎯 LEADS ({leads.length})</Text>
                {leads.map((lead) => (
                  <TouchableOpacity
                    key={lead.id}
                    activeOpacity={0.7}
                    onPress={() => handleSelectLead(lead)}
                    style={styles.resultItem}
                  >
                    <View style={styles.leadIconBox}>
                      <Text style={styles.leadIconText}>🎯</Text>
                    </View>
                    <View style={styles.resultMain}>
                      <View style={styles.titleWithMeta}>
                        <Text style={styles.resultTitle}>{lead.customer_name}</Text>
                        <Text style={styles.resultCompany}>• {lead.company}</Text>
                      </View>
                      <Text style={styles.resultSubtitle}>
                        ${lead.deal_value.toLocaleString()} Deal • {lead.score} Score
                      </Text>
                    </View>
                    <View style={styles.stageBadge}>
                      <Text style={styles.stageBadgeText}>{lead.stage.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.arrowIcon}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Voice Calls Results */}
            {filteredCalls.length > 0 ? (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>🎙️ VOICE AI CALLS ({filteredCalls.length})</Text>
                {filteredCalls.map((call) => (
                  <TouchableOpacity
                    key={call.id}
                    activeOpacity={0.7}
                    onPress={() => handleSelectCall(call)}
                    style={styles.resultItem}
                  >
                    <View style={styles.callIconBox}>
                      <Text style={styles.callIconText}>📞</Text>
                    </View>
                    <View style={styles.resultMain}>
                      <Text style={styles.resultTitle}>{call.customer_name}</Text>
                      <Text style={styles.resultSubtitle}>
                        {call.customer_phone} • {call.agent_name}
                      </Text>
                    </View>
                    <View style={styles.callStatusBadge}>
                      <Text style={styles.callStatusText}>{call.status.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.arrowIcon}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {/* Empty State */}
            {query.trim() &&
            conversations.length === 0 &&
            leads.length === 0 &&
            filteredCalls.length === 0 &&
            filteredActions.length === 0 &&
            !isLoading ? (
              <View style={styles.emptyResults}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No matching results for "{query}"</Text>
                <Text style={styles.emptySubtitle}>
                  Try searching by customer name, company, deal value, or a navigation command.
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Shortcuts */}
          <View style={styles.footerBar}>
            <View style={styles.shortcutItem}>
              <View style={styles.shortcutKey}>
                <Text style={styles.shortcutKeyText}>↑↓</Text>
              </View>
              <Text style={styles.shortcutLabel}>Navigate</Text>
            </View>
            <View style={styles.shortcutItem}>
              <View style={styles.shortcutKey}>
                <Text style={styles.shortcutKeyText}>↵</Text>
              </View>
              <Text style={styles.shortcutLabel}>Select</Text>
            </View>
            <View style={styles.shortcutItem}>
              <View style={styles.shortcutKey}>
                <Text style={styles.shortcutKeyText}>ESC</Text>
              </View>
              <Text style={styles.shortcutLabel}>Dismiss</Text>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? '8vh' : 40,
    paddingHorizontal: SPACING.md,
  } as any,
  paletteCard: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '80vh',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xxl, // 24
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  } as any,
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 6,
    paddingHorizontal: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
          boxShadow: 'none',
        }
      : {}),
  } as any,
  clearBtn: {
    padding: 6,
    marginRight: 6,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  escBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  escBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#6B7280',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetsLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginRight: 4,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetChipText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  resultsScroll: {
    flex: 1,
    maxHeight: 460,
  },
  resultsContent: {
    paddingVertical: SPACING.sm,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sectionBlock: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    letterSpacing: 0.8,
    color: '#9CA3AF',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F9FAFB',
  },
  actionIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionIconText: {
    fontSize: 15,
  },
  resultMain: {
    flex: 1,
  },
  titleWithMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#111827',
  },
  resultCompany: {
    fontSize: 12,
    color: '#6B7280',
  },
  resultSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  resultSnippet: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  convAvatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  convAvatarText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
  leadIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFF8F5',
    borderWidth: 1,
    borderColor: '#FFD7CA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leadIconText: {
    fontSize: 14,
  },
  callIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  callIconText: {
    fontSize: 14,
  },
  badgePill: {
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: '#4B5563',
  },
  channelBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  channelBadgeText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#4B5563',
  },
  whatsappBadge: {
    backgroundColor: '#DCFCE7',
  },
  smsBadge: {
    backgroundColor: '#FFF2ED',
  },
  stageBadge: {
    backgroundColor: '#18181B',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  stageBadgeText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
  callStatusBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  callStatusText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#92400E',
  },
  arrowIcon: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  emptyResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#111827',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  shortcutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shortcutKey: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  shortcutKeyText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#4B5563',
  },
  shortcutLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
});
