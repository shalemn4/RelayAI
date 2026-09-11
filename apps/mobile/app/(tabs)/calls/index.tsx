import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Call, CallUtterance } from '@relay-ai/types';
import { api } from '../../../services/api';
import { realtimeManager } from '../../../services/realtime';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { analytics } from '../../../services/analytics';

export default function CallsScreen() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeCallId, setActiveCallId] = useState<number | null>(null);

  // 1. Fetch Calls List
  const { data: calls = [], isLoading, refetch } = useQuery<Call[]>({
    queryKey: ['calls'],
    queryFn: async () => {
      const res = await api.get('/calls');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const safeCalls = Array.isArray(calls) ? calls : [];

  // 2. Fetch Selected Call Detail & Transcript
  const { data: activeCall, refetch: refetchActiveCall } = useQuery<Call>({
    queryKey: ['call', activeCallId],
    queryFn: async () => {
      const res = await api.get(`/calls/${activeCallId}`);
      return res.data;
    },
    enabled: !!activeCallId,
  });

  // 3. Realtime WebSocket listener for live transcript utterances
  useEffect(() => {
    if (!activeCallId) return;

    const topic = `call:${activeCallId}`;
    const unsubscribe = realtimeManager.subscribe(topic, (payload) => {
      queryClient.setQueryData(['call', activeCallId], (old: Call | undefined) => {
        if (!old) return old;
        const exists = (old.utterances || []).some((u) => u.id === payload.id);
        if (exists) return old;
        return {
          ...old,
          utterances: [...(old.utterances || []), payload],
        };
      });
      showToast('New speech utterance received', 'info');
    });

    return () => {
      unsubscribe();
    };
  }, [activeCallId]);

  // 4. Supervisor Takeover Mutation
  const takeoverMutation = useMutation({
    mutationFn: async (callId: number) => {
      const res = await api.post(`/calls/${callId}/takeover`);
      return res.data;
    },
    onSuccess: () => {
      analytics.track('call_takeover_triggered', { call_id: activeCallId });
      showToast('You have taken over this voice call from the AI agent.', 'success');
      queryClient.invalidateQueries({ queryKey: ['call', activeCallId] });
      queryClient.invalidateQueries({ queryKey: ['calls'] });
    },
  });

  // 5. Simulate utterance turn for demo review
  const simulateUtteranceMutation = useMutation({
    mutationFn: async () => {
      if (!activeCallId) return;
      const res = await api.post(
        `/calls/${activeCallId}/simulate-utterance?speaker=customer&text=Could%20you%20confirm%20the%20onboarding%20schedule%20for%20tomorrow%3F`
      );
      return res.data;
    },
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      {/* Subheader banner */}
      <View style={styles.topBanner}>
        <Text style={styles.topBannerTitle}>🎙️ Voice AI Agent Monitoring</Text>
        <Text style={styles.topBannerDesc}>
          Supervise live speech-to-text turns, inspect caller sentiment, and trigger instant supervisor handoff.
        </Text>
      </View>

      {/* Calls list */}
      <FlatList
        data={safeCalls}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        renderItem={({ item }) => {
          if (!item?.id) return null;
          const isLive = item.status !== 'completed';
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setActiveCallId(item.id);
                analytics.track('call_opened', { call_id: item.id, status: item.status });
              }}
              style={[styles.callCard, isLive && styles.callCardLive]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.callerCol}>
                  <Text style={styles.callerName}>{item.customer_name}</Text>
                  <Text style={styles.callerPhone}>{item.customer_phone}</Text>
                </View>

                <View style={styles.statusPill}>
                  {isLive ? <View style={styles.livePulsingDot} /> : null}
                  <Text
                    style={[
                      styles.statusText,
                      isLive ? styles.statusTextLive : styles.statusTextCompleted,
                    ]}
                  >
                    {item.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.summaryText}>{item.intent_summary || 'No summary available'}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.agentTag}>🤖 {item.agent_name}</Text>
                <Text style={styles.durationText}>⏱ {formatDuration(item.duration_seconds)}</Text>
                <Badge type="sentiment" value={item.sentiment} label={item.sentiment} />
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      {/* Live Call Transcript Modal */}
      <Modal
        visible={!!activeCallId}
        onClose={() => setActiveCallId(null)}
        title={activeCall ? `Live Call: ${activeCall.customer_name}` : 'Call Transcript'}
      >
        {activeCall ? (
          <View style={styles.modalBody}>
            {/* Telemetry info bar */}
            <View style={styles.callMetaBanner}>
              <View>
                <Text style={styles.metaPhone}>{activeCall.customer_phone}</Text>
                <Text style={styles.metaAgent}>Handled by {activeCall.agent_name}</Text>
              </View>
              <View style={styles.metaRight}>
                <Text style={styles.metaDuration}>⏱ {formatDuration(activeCall.duration_seconds)}</Text>
                <Badge type="sentiment" value={activeCall.sentiment} label={activeCall.sentiment} />
              </View>
            </View>

            {/* Simulated Audio Waveform Bar */}
            <View style={styles.audioWaveContainer}>
              <Text style={styles.waveText}>AUDIO WAVEFORM [SIMULATED TELEPHONY STREAM]</Text>
              <View style={styles.waveformBars}>
                {[12, 24, 18, 32, 14, 28, 36, 20, 16, 30, 22, 18, 26, 15, 34].map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      { height: h, backgroundColor: i % 2 === 0 ? COLORS.accent : '#FFA07A' },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Transcript utterances stream */}
            <Text style={styles.transcriptTitle}>REAL-TIME TRANSCRIPT STREAM:</Text>
            <ScrollView style={styles.transcriptScroll}>
              {(activeCall.utterances || []).map((utt) => (
                <View
                  key={utt.id}
                  style={[
                    styles.utteranceCard,
                    utt.speaker === 'agent' ? styles.utteranceAgent : styles.utteranceCustomer,
                  ]}
                >
                  <View style={styles.utteranceHeader}>
                    <Text style={styles.speakerText}>
                      {utt.speaker === 'agent' ? '🤖 AI AGENT' : '👤 CALLER'}
                    </Text>
                    {utt.confidence ? (
                      <Text style={styles.confText}>{Math.round(utt.confidence * 100)}% Conf</Text>
                    ) : null}
                  </View>
                  <Text style={styles.utteranceText}>{utt.text}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Action Bar */}
            <View style={styles.modalActions}>
              <Button
                title="Simulate Speech Turn"
                variant="outline"
                size="sm"
                onPress={() => simulateUtteranceMutation.mutate()}
              />
              {activeCall.status !== 'human_takeover' && activeCall.status !== 'completed' ? (
                <Button
                  title="Take Over Call"
                  variant="destructive"
                  size="sm"
                  onPress={() => takeoverMutation.mutate(activeCall.id)}
                />
              ) : null}
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBanner: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  topBannerTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  topBannerDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  callCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  callCardLive: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF8F5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  callerCol: {
    flex: 1,
  },
  callerName: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  callerPhone: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  livePulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent, // Glowing Orange Dot
  },
  statusText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  statusTextLive: {
    color: COLORS.accent,
  },
  statusTextCompleted: {
    color: COLORS.textMuted,
  },
  summaryText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.text,
    marginVertical: SPACING.xs,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  agentTag: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  durationText: {
    fontSize: 11,
    color: COLORS.textSubtle,
  },
  modalBody: {
    gap: SPACING.sm,
  },
  callMetaBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  metaPhone: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  metaAgent: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  metaRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  metaDuration: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  audioWaveContainer: {
    backgroundColor: '#18181B', // Dark card
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
  },
  waveText: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: TYPOGRAPHY.weight.bold,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 38,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  transcriptTitle: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textSubtle,
    marginTop: SPACING.xs,
  },
  transcriptScroll: {
    maxHeight: 240,
    gap: SPACING.xs,
  },
  utteranceCard: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  utteranceAgent: {
    backgroundColor: '#FFF8F5',
    borderColor: '#FED7AA',
  },
  utteranceCustomer: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.border,
  },
  utteranceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  speakerText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textMuted,
  },
  confText: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  utteranceText: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
});
