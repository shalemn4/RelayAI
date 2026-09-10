import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lead, LeadStage } from '@relay-ai/types';
import { api } from '../../../services/api';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../constants/theme';
import { analytics } from '../../../services/analytics';

const STAGES: LeadStage[] = ['new', 'contacted', 'qualified', 'demo', 'won', 'lost'];

export default function LeadsScreen() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'deal_value' | 'last_activity_at'>('score');
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [bulkStageModalVisible, setBulkStageModalVisible] = useState(false);

  // 1. Fetch leads
  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ['leads', { stage: selectedStage, search, sortBy }],
    queryFn: async () => {
      const res = await api.get('/leads', {
        params: {
          stage: selectedStage !== 'all' ? selectedStage : undefined,
          search: search.trim() || undefined,
          sort_by: sortBy,
        },
      });
      return res.data;
    },
  });

  // 2. Stage Counts and Pipeline Volumes
  const stageStats = React.useMemo(() => {
    const stats: Record<string, { count: number; totalValue: number }> = {};
    for (const stg of STAGES) {
      stats[stg] = { count: 0, totalValue: 0 };
    }
    for (const lead of leads) {
      if (stats[lead.stage]) {
        stats[lead.stage].count += 1;
        stats[lead.stage].totalValue += lead.deal_value;
      }
    }
    return stats;
  }, [leads]);

  const totalPipelineValue = React.useMemo(() => {
    return leads.reduce((sum, l) => sum + (l.deal_value || 0), 0);
  }, [leads]);

  // 3. Bulk Stage Update Mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (targetStage: LeadStage) => {
      const res = await api.post('/leads/bulk-stage', {
        lead_ids: selectedLeadIds,
        stage: targetStage,
      });
      return res.data;
    },
    onSuccess: (data, targetStage) => {
      analytics.track('lead_stage_changed', {
        count: selectedLeadIds.length,
        new_stage: targetStage,
      });
      showToast(`Updated ${selectedLeadIds.length} lead(s) to ${targetStage.toUpperCase()}`, 'success');
      setSelectedLeadIds([]);
      setBulkStageModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (err: any) => {
      showToast(err.message || 'Bulk update failed', 'error');
    },
  });

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const toggleLeadSelect = (id: number) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWrap}>
        {/* 1. Executive Floating Header Bento Card */}
        <View style={styles.executiveCard}>
          {/* Header Row: Title & Action CTAs */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleCol}>
              <Text style={styles.cardTitle}>🎯 Lead Pipeline & Directory</Text>
              <Text style={styles.cardSubtitle}>
                Track deal stages, inspect pipeline volume, and execute bulk lead operations.
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.exportBtn}
                onPress={() => showToast('Exporting lead roster to CSV...', 'info')}
              >
                <Text style={styles.exportBtnText}>Export CSV ⤓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.addLeadBtn}
                onPress={() => showToast('Lead creation initiated', 'info')}
              >
                <Text style={styles.addLeadBtnText}>+ Add Lead</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Input Row */}
          <View style={styles.searchRow}>
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search leads by customer, company, or email..."
              style={styles.searchInput}
            />
          </View>

          {/* Pipeline Stage Summary Cards - Spacious and Breathable */}
          <View style={styles.pipelineWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pipelineScroll}
              contentContainerStyle={styles.pipelineContent}
            >
              {/* ALL LEADS CARD */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedStage('all')}
                style={[styles.stageCard, selectedStage === 'all' && styles.stageCardActive]}
              >
                <Text style={[styles.stageCardLabel, selectedStage === 'all' && styles.stageCardLabelActive]}>
                  ALL LEADS
                </Text>
                <Text style={[styles.stageCardCount, selectedStage === 'all' && styles.stageCardCountActive]}>
                  {leads.length}
                </Text>
                <Text style={[styles.stageCardValue, selectedStage === 'all' && styles.stageCardValueActive]}>
                  ${(totalPipelineValue / 1000).toFixed(0)}k
                </Text>
              </TouchableOpacity>

              {/* STAGE CARDS */}
              {STAGES.map((stg) => {
                const stat = stageStats[stg] || { count: 0, totalValue: 0 };
                const isActive = selectedStage === stg;
                return (
                  <TouchableOpacity
                    key={stg}
                    activeOpacity={0.8}
                    onPress={() => setSelectedStage(stg)}
                    style={[styles.stageCard, isActive && styles.stageCardActive]}
                  >
                    <Text style={[styles.stageCardLabel, isActive && styles.stageCardLabelActive]}>
                      {stg.toUpperCase()}
                    </Text>
                    <Text style={[styles.stageCardCount, isActive && styles.stageCardCountActive]}>
                      {stat.count}
                    </Text>
                    <Text style={[styles.stageCardValue, isActive && styles.stageCardValueActive]}>
                      ${(stat.totalValue / 1000).toFixed(0)}k
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* 2. Table Controls / Selection & Sorting Bar */}
        <View style={styles.tableControls}>
          <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllRow}>
            <View
              style={[
                styles.checkbox,
                selectedLeadIds.length === leads.length && leads.length > 0 && styles.checkboxChecked,
              ]}
            >
              {selectedLeadIds.length > 0 ? (
                <Text style={styles.checkIcon}>✓</Text>
              ) : null}
            </View>
            <Text style={styles.selectText}>
              {selectedLeadIds.length > 0
                ? `${selectedLeadIds.length} of ${leads.length} selected`
                : 'Select all leads'}
            </Text>
          </TouchableOpacity>

          {/* Sort selector */}
          <View style={styles.sortRow}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            {(['score', 'deal_value'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setSortBy(s)}
                style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
              >
                <Text style={[styles.sortChipText, sortBy === s && styles.sortChipTextActive]}>
                  {s === 'score' ? 'Score' : 'Deal Value'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Lead Cards List */}
        <FlatList
          data={leads}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const isSelected = selectedLeadIds.includes(item.id);
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleLeadSelect(item.id)}
                style={[styles.leadRow, isSelected && styles.leadRowSelected]}
              >
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxChecked,
                    { marginRight: SPACING.md },
                  ]}
                >
                  {isSelected ? <Text style={styles.checkIcon}>✓</Text> : null}
                </View>

                <View style={styles.leadMain}>
                  <View style={styles.rowTop}>
                    <Text style={styles.leadName}>{item.customer_name}</Text>
                    <Text style={styles.leadCompany}>({item.company})</Text>
                  </View>
                  <Text style={styles.leadContact}>
                    {item.customer_email} • {item.customer_phone}
                  </Text>
                </View>

                <View style={styles.leadMetrics}>
                  <View style={styles.scorePill}>
                    <Text style={styles.scoreText}>{item.score} Score</Text>
                  </View>
                  <Text style={styles.dealValueText}>${item.deal_value.toLocaleString()}</Text>
                </View>

                <Badge type="lead_stage" value={item.stage} label={item.stage} />
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
        />

        {/* Floating Bulk Actions Bar */}
        {selectedLeadIds.length > 0 ? (
          <View style={styles.bulkBar}>
            <Text style={styles.bulkText}>{selectedLeadIds.length} lead(s) selected</Text>
            <Button
              title="Change Stage"
              variant="primary"
              size="sm"
              onPress={() => setBulkStageModalVisible(true)}
            />
          </View>
        ) : null}

        {/* Bulk Stage Selector Modal */}
        <Modal
          visible={bulkStageModalVisible}
          onClose={() => setBulkStageModalVisible(false)}
          title="Update Lead Stage (Bulk)"
        >
          <Text style={styles.modalSubtext}>
            Choose the new pipeline stage for the {selectedLeadIds.length} selected lead(s):
          </Text>
          <View style={styles.stageOptionsGrid}>
            {STAGES.map((stg) => (
              <TouchableOpacity
                key={stg}
                onPress={() => bulkUpdateMutation.mutate(stg)}
                style={styles.stageOptionBtn}
              >
                <Text style={styles.stageOptionText}>{stg.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // #F3F4F6 Luxury light grey canvas
  },
  contentWrap: {
    flex: 1,
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
  },
  // 1. Executive Floating Header Bento Card
  executiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xxl, // 24
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: SPACING.xl, // 24
    marginHorizontal: SPACING.xl, // 24
    marginTop: SPACING.xl, // 24
    marginBottom: SPACING.md, // 16
    ...SHADOWS.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  titleCol: {
    flex: 1,
    minWidth: 260,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.size.title, // 20
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exportBtn: {
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: '#4B5563',
  },
  addLeadBtn: {
    backgroundColor: COLORS.accent, // Radiant Orange #FF5520
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  addLeadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  searchRow: {
    marginTop: 18,
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  pipelineWrapper: {
    paddingTop: 4,
  },
  pipelineScroll: {
    overflow: 'visible',
  },
  pipelineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  stageCard: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.xl, // 20
    paddingHorizontal: 18,
    paddingVertical: 12,
    minWidth: 124,
    height: 84,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  stageCardActive: {
    backgroundColor: '#18181B', // Deep pitch black active card
    borderColor: '#18181B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  stageCardLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    letterSpacing: 0.8,
    color: '#6B7280',
  },
  stageCardLabelActive: {
    color: '#9CA3AF',
  },
  stageCardCount: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#111827',
    lineHeight: 26,
  },
  stageCardCountActive: {
    color: '#FFFFFF',
  },
  stageCardValue: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: '#9CA3AF',
  },
  stageCardValueActive: {
    color: '#FF5520', // Radiant coral metric
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  // Table Controls
  tableControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.xl,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    marginBottom: 6,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent, // Radiant orange
    borderColor: COLORS.accent,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  selectText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginRight: 2,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortChipActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  sortChipText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  sortChipTextActive: {
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 80,
    gap: 8,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl, // Floating smooth cards
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.sm,
  },
  leadRowSelected: {
    backgroundColor: '#FFF8F5',
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  leadMain: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  leadName: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  leadCompany: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  leadContact: {
    fontSize: 11,
    color: COLORS.textSubtle,
    marginTop: 3,
  },
  leadMetrics: {
    alignItems: 'flex-end',
    marginRight: SPACING.lg,
  },
  scorePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#065F46',
  },
  dealValueText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  bulkBar: {
    position: 'absolute',
    bottom: 24,
    left: SPACING.xl,
    right: SPACING.xl,
    backgroundColor: '#18181B',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  bulkText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  modalSubtext: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  stageOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  stageOptionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stageOptionText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
});
