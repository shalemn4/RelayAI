import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Conversation, Message, AISuggestion } from '@relay-ai/types';
import { api } from '../../../services/api';
import { realtimeManager } from '../../../services/realtime';
import { analytics } from '../../../services/analytics';
import { MessageBubble } from '../../../components/ui/MessageBubble';
import { AISuggestionCard } from '../../../features/conversations/AISuggestionCard';
import { TakeoverBanner } from '../../../features/conversations/TakeoverBanner';
import { MessageComposer } from '../../../features/conversations/MessageComposer';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { useToast } from '../../../components/ui/Toast';
import { useOfflineStore } from '../../../store/useOfflineStore';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../constants/theme';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams();
  const convId = parseInt(id as string, 10);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { isOnline, enqueueMessage, queuedMessages, retryMessage } = useOfflineStore();
  const [composerText, setComposerText] = useState('');
  const [showContext, setShowContext] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // 1. Fetch Conversation Details & History
  const {
    data: conversation,
    isLoading,
    isError,
    refetch,
  } = useQuery<Conversation & { messages: Message[] }>({
    queryKey: ['conversation', convId],
    queryFn: async () => {
      const res = await api.get(`/conversations/${convId}`);
      return res.data;
    },
    enabled: !!convId,
  });

  // 2. Fetch AI Suggestion
  const {
    data: suggestion,
    isLoading: isSuggestionLoading,
    refetch: refetchSuggestion,
  } = useQuery<AISuggestion>({
    queryKey: ['ai-suggestion', convId],
    queryFn: async () => {
      const res = await api.post(`/conversations/${convId}/ai-suggestion`);
      return res.data;
    },
    enabled: !!convId && conversation?.status !== 'resolved',
  });

  // 3. Subscribe to Real-time WebSocket topic
  useEffect(() => {
    if (!convId) return;

    const topic = `conversation:${convId}`;
    const unsubscribe = realtimeManager.subscribe(topic, (payload) => {
      // Real-time message arrived
      queryClient.setQueryData(['conversation', convId], (oldData: any) => {
        if (!oldData) return oldData;
        const exists = oldData.messages.some((m: Message) => m.id === payload.id);
        if (exists) {
          return {
            ...oldData,
            messages: oldData.messages.map((m: Message) => (m.id === payload.id ? payload : m)),
          };
        }
        return {
          ...oldData,
          messages: [...oldData.messages, payload],
        };
      });
    });

    return () => {
      unsubscribe();
    };
  }, [convId]);

  // 4. Optimistic Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/conversations/${convId}/messages`, { content });
      return res.data;
    },
    onMutate: async (newContent: string) => {
      await queryClient.cancelQueries({ queryKey: ['conversation', convId] });
      const previous = queryClient.getQueryData(['conversation', convId]);

      // Optimistic message object
      const tempId = `temp_${Date.now()}`;
      const optimisticMsg: Message = {
        id: tempId,
        conversation_id: convId,
        sender_role: 'human',
        sender_name: 'Jordan Hayes',
        content: newContent,
        status: 'sending',
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(['conversation', convId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...old.messages, optimisticMsg],
        };
      });

      return { previous, tempId };
    },
    onSuccess: (savedMsg, newContent, context) => {
      analytics.track('message_sent', {
        conversation_id: convId,
        channel: conversation?.channel,
        lead_stage: conversation?.lead_stage,
      });

      queryClient.setQueryData(['conversation', convId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m: Message) => (m.id === context?.tempId ? savedMsg : m)),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      refetchSuggestion();
    },
    onError: (err, newContent, context) => {
      showToast('Message failed to send. Stored in queue for retry.', 'error');
      // Mark as failed in cache
      queryClient.setQueryData(['conversation', convId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m: Message) =>
            m.id === context?.tempId ? { ...m, status: 'failed' } : m
          ),
        };
      });
    },
  });

  // Handle Send: Online vs Offline Queue
  const handleSendMessage = (text: string) => {
    if (!isOnline) {
      // Enqueue to offline store
      const queued = enqueueMessage(convId, text);
      const optimisticMsg: Message = {
        id: queued.tempId,
        conversation_id: convId,
        sender_role: 'human',
        sender_name: 'Jordan Hayes',
        content: text,
        status: 'waiting_to_send',
        created_at: queued.createdAt,
      };

      queryClient.setQueryData(['conversation', convId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...old.messages, optimisticMsg],
        };
      });
      showToast('Saved offline. Will send once connected.', 'info');
      return;
    }

    sendMessageMutation.mutate(text);
  };

  // 5. Accept AI Suggestion Mutation
  const acceptSuggestionMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post(`/conversations/${convId}/ai-suggestion/feedback`, {
        action: 'accept',
        final_text: text,
      });
      return res.data;
    },
    onMutate: async (text: string) => {
      const tempId = `sug_${Date.now()}`;
      const optimisticMsg: Message = {
        id: tempId,
        conversation_id: convId,
        sender_role: 'ai',
        sender_name: conversation?.assigned_agent_name || 'AI Assistant',
        content: text,
        status: 'sending',
        metadata: { confidence: suggestion?.confidence || 0.94 },
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(['conversation', convId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...old.messages, optimisticMsg],
        };
      });
      return { tempId };
    },
    onSuccess: (data, text) => {
      analytics.track('ai_suggestion_accepted', {
        conversation_id: convId,
        confidence: suggestion?.confidence,
        channel: conversation?.channel,
        lead_stage: conversation?.lead_stage,
      });
      showToast('AI suggestion approved and sent!', 'success');
      queryClient.invalidateQueries({ queryKey: ['conversation', convId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['ai-suggestion', convId] });
    },
  });

  // 5b. Regenerate AI Suggestion Mutation
  const regenerateSuggestionMutation = useMutation({
    mutationFn: async () => {
      // 1. Fire feedback event to backend to record regeneration telemetry
      try {
        await api.post(`/conversations/${convId}/ai-suggestion/feedback`, {
          action: 'regenerate',
          original_text: suggestion?.text,
        });
      } catch {
        // Continue even if feedback fails
      }

      // 2. Request new AI suggestion with regenerate=true
      const res = await api.post(`/conversations/${convId}/ai-suggestion?regenerate=true&t=${Date.now()}`);
      return res.data as AISuggestion;
    },
    onSuccess: (newSuggestion) => {
      analytics.track('ai_suggestion_regenerated', {
        conversation_id: convId,
        confidence: newSuggestion.confidence,
        channel: conversation?.channel,
        lead_stage: conversation?.lead_stage,
      });
      // Directly update the query cache with the new suggestion
      queryClient.setQueryData(['ai-suggestion', convId], newSuggestion);
      showToast('✨ Fresh AI suggestion generated!', 'success');
    },
    onError: () => {
      showToast('Failed to regenerate suggestion. Retrying...', 'warning');
      refetchSuggestion();
    },
  });

  // 6. Takeover Mutation
  const takeoverMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/conversations/${convId}/takeover`);
      return res.data;
    },
    onSuccess: () => {
      analytics.track('human_takeover', {
        conversation_id: convId,
        channel: conversation?.channel,
        lead_stage: conversation?.lead_stage,
      });
      showToast('You took over this conversation from AI', 'info');
      queryClient.setQueryData(['conversation', convId], (old: any) =>
        old ? { ...old, status: 'human_assigned' } : old
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // 7. Return to AI Mutation
  const returnToAIMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/conversations/${convId}/return-to-ai`);
      return res.data;
    },
    onSuccess: () => {
      showToast('Returned conversation to AI autonomous handling', 'info');
      queryClient.setQueryData(['conversation', convId], (old: any) =>
        old ? { ...old, status: 'ai_active' } : old
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading conversation history...</Text>
      </View>
    );
  }

  if (isError || !conversation) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Failed to load conversation</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Avatar
          name={conversation.customer.name}
          url={conversation.customer.avatar_url}
          size="sm"
        />

        <View style={styles.customerMeta}>
          <Text style={styles.customerName} numberOfLines={1}>
            {conversation.customer.name}
          </Text>
          <Text style={styles.customerCompany} numberOfLines={1}>
            {conversation.customer.company}
          </Text>
        </View>

        <View style={styles.headerBadges}>
          <Badge type="channel" value={conversation.channel} label={conversation.channel} />
          <Badge type="status" value={conversation.status} label={conversation.status} dot />
        </View>

        <TouchableOpacity
          onPress={() => setShowContext(!showContext)}
          style={styles.infoBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.infoIcon}>{showContext ? '✕' : 'ℹ️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Customer Context Drawer */}
      {showContext ? (
        <View style={styles.contextDrawer}>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Email:</Text>
            <Text style={styles.contextVal}>{conversation.customer.email}</Text>
          </View>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Phone:</Text>
            <Text style={styles.contextVal}>{conversation.customer.phone}</Text>
          </View>
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Lead Stage:</Text>
            <Text style={styles.contextVal}>{conversation.lead_stage?.toUpperCase() || 'NEW'}</Text>
          </View>
          {conversation.lead_score ? (
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Lead Score:</Text>
              <Text style={styles.contextVal}>{conversation.lead_score}/100</Text>
            </View>
          ) : null}
          <View style={styles.contextRow}>
            <Text style={styles.contextLabel}>Tags:</Text>
            <Text style={styles.contextVal}>
              {(conversation.tags || []).join(', ') || 'None'}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Human Takeover / Return to AI Banner */}
      <TakeoverBanner
        status={conversation.status}
        onTakeover={() => takeoverMutation.mutate()}
        onReturnToAI={() => returnToAIMutation.mutate()}
        isLoading={takeoverMutation.isPending || returnToAIMutation.isPending}
      />

      {/* Messages Timeline */}
      <FlatList
        ref={flatListRef}
        data={conversation.messages || []}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        renderItem={({ item }) => {
          if (!item?.id) return null;
          return (
            <MessageBubble
              message={item}
              onRetry={(tempId) => retryMessage(tempId, queryClient)}
            />
          );
        }}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* AI Suggestion Card (Hero HITL feature) */}
      {suggestion && suggestion.state !== 'rejected' && suggestion.state !== 'accepted' ? (
        <AISuggestionCard
          suggestion={suggestion}
          isGenerating={regenerateSuggestionMutation.isPending}
          onAccept={(text) => acceptSuggestionMutation.mutate(text)}
          onEdit={(text) => {
            setComposerText(text);
            analytics.track('ai_suggestion_edited', { conversation_id: convId });
          }}
          onRegenerate={() => regenerateSuggestionMutation.mutate()}
          onReject={() => {
            analytics.track('ai_suggestion_rejected', { conversation_id: convId });
            queryClient.setQueryData(['ai-suggestion', convId], (old: any) =>
              old ? { ...old, state: 'rejected' } : old
            );
          }}
        />
      ) : null}

      {/* Message Composer */}
      <MessageComposer
        onSend={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
        initialText={composerText}
        onTextChange={setComposerText}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Luxury light grey
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.danger,
    marginBottom: SPACING.md,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  customerMeta: {
    flex: 1,
  },
  customerName: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  customerCompany: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    fontSize: 15,
  },
  contextDrawer: {
    backgroundColor: '#FFFFFF',
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    ...SHADOWS.sm,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextLabel: {
    width: 90,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textMuted,
  },
  contextVal: {
    fontSize: 11,
    color: COLORS.text,
    flex: 1,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  messagesList: {
    paddingVertical: SPACING.md,
  },
});
