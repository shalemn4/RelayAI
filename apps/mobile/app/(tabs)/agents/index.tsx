import React from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { AIAgent } from '@relay-ai/types';
import { api } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { StatusIndicator } from '../../../components/ui/StatusIndicator';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../../constants/theme';

export default function AgentsScreen() {
  const { data: agents = [], isLoading } = useQuery<AIAgent[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await api.get('/agents');
      return res.data;
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerBanner}>
        <Text style={styles.bannerTitle}>🤖 AI Agent Fleet Telemetry</Text>
        <Text style={styles.bannerDesc}>
          Monitor active AI triage agents, autonomous conversation volume, confidence metrics, and human handoff rates.
        </Text>
      </View>

      <FlatList
        data={agents}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card variant="elevated" padding="md" style={styles.agentCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.agentName}>{item.name}</Text>
                <Text style={styles.agentRole}>{item.role}</Text>
              </View>
              <StatusIndicator
                status={item.status as any}
                label={item.status.toUpperCase()}
              />
            </View>

            <Text style={styles.agentDesc}>{item.description}</Text>

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{item.conversations_handled}</Text>
                <Text style={styles.metricLbl}>Handled</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{Math.round(item.avg_confidence * 100)}%</Text>
                <Text style={styles.metricLbl}>Avg Confidence</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricVal}>{Math.round(item.takeover_rate * 100)}%</Text>
                <Text style={styles.metricLbl}>Takeover Rate</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.modelText}>Model: {item.model}</Text>
            </View>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBanner: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  bannerTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  bannerDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  agentCard: {
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  agentName: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  agentRole: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  agentDesc: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.text,
    lineHeight: 16,
    marginVertical: SPACING.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  metricLbl: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modelText: {
    fontSize: 10,
    color: COLORS.textSubtle,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
