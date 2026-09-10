import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../constants/theme';
import { api } from '../../../services/api';
import { Conversation, AIAgent } from '@relay-ai/types';
import { useAuthStore } from '../../../store/useAuthStore';
import { Avatar } from '../../../components/ui/Avatar';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  // Fetch recent active conversations for the dark live stream card
  const { data: convData } = useQuery<{ items: Conversation[]; total: number }>({
    queryKey: ['conversations-dashboard'],
    queryFn: async () => {
      const res = await api.get('/conversations', { params: { limit: 4 } });
      return res.data;
    },
  });

  // Fetch live agents for the matrix card
  const { data: agents = [] } = useQuery<AIAgent[]>({
    queryKey: ['agents-dashboard'],
    queryFn: async () => {
      const res = await api.get('/agents');
      return res.data;
    },
  });

  // Fetch data-driven analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics-overview-dashboard'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview', { params: { period: '30d' } });
      return res.data;
    },
  });

  const conversations = convData?.items || [];
  const totalMessages = analyticsData?.total_messages || 2480;
  const aiResolutionRate = analyticsData?.ai_resolution_rate
    ? `${Math.round(analyticsData.ai_resolution_rate * 100)}%`
    : '84.2%';

  // Dot matrix: 4 rows of 8 dots (representing live AI agent sessions)
  const dotMatrix = [
    [0, 0, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 0, 0],
    [1, 1, 0, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Executive Subheader & Quick Action Controls */}
      <View style={styles.topNavCard}>
        {/* Subheader: Title, Channels, CTAs */}
        <View style={styles.subHeaderRow}>
          <View style={styles.titleMeta}>
            <Text style={styles.dashboardTitle}>Dashboard Overview</Text>
            <Text style={styles.dashboardSubtitle}>
              Manage your customer conversations, AI agents, analytics and statistics
            </Text>
          </View>

          <View style={styles.headerActionsGroup}>
            {/* Connected Services cluster */}
            <View style={styles.servicesCluster}>
              <Text style={styles.servicesTitle}>Services connected (4)</Text>
              <View style={styles.servicesAvatarsRow}>
                <View style={[styles.servicePill, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={styles.serviceIconText}>💬</Text>
                </View>
                <View style={[styles.servicePill, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={styles.serviceIconText}>🟢</Text>
                </View>
                <View style={[styles.servicePill, { backgroundColor: '#FFF2ED' }]}>
                  <Text style={styles.serviceIconText}>✉️</Text>
                </View>
                <View style={[styles.servicePill, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={styles.serviceIconText}>🌐</Text>
                </View>
                <View style={[styles.servicePill, styles.servicePlus]}>
                  <Text style={styles.servicePlusText}>+</Text>
                </View>
              </View>
            </View>

            {/* Black Pill Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/inbox')}
              style={styles.blackHeaderBtn}
            >
              <Text style={styles.blackBtnText}>Customize Dashboard ☵</Text>
            </TouchableOpacity>

            {/* Radiant Coral CTA Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/inbox')}
              style={styles.coralHeaderBtn}
            >
              <Text style={styles.coralBtnText}>Add Tasks +</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. Top Bento Row: Dark Live Stream Card + Stats Stack */}
      <View style={styles.bentoRow}>
        {/* Dark Bento Card: Calendar of Meetings / Live Conversation Stream */}
        <View style={styles.darkStreamCard}>
          <View style={styles.darkHeaderRow}>
            <Text style={styles.darkCardTitle}>Calendar of meetings</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTimeframe(timeframe === 'week' ? 'month' : 'week')}
              style={styles.timeDropdownPill}
            >
              <Text style={styles.timeDropdownText}>
                {timeframe === 'week' ? 'This week ▾' : 'This month ▾'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Timeline View */}
          <View style={styles.timelineArea}>
            {/* Time ticks */}
            <View style={styles.rulerCol}>
              <Text style={styles.rulerLabel}>08:00 AM</Text>
              <Text style={styles.rulerLabel}>09:00 AM</Text>
              <Text style={styles.rulerLabel}>10:00 AM</Text>
              <Text style={styles.rulerLabel}>11:00 AM</Text>
              <Text style={styles.rulerLabel}>12:00 AM</Text>
            </View>

            {/* Floating White Cards */}
            <View style={styles.cardsFloatingCol}>
              {/* Card 1: Weekly Design Sprint */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  if (conversations[0]) router.push(`/(tabs)/inbox/${conversations[0].id}`);
                }}
                style={[styles.streamFloatingCard, { top: 12, left: 10, width: '70%' }]}
              >
                <View style={styles.floatingCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.floatingCardHeading}>Weekly design sprint</Text>
                    <Text style={styles.floatingCardSub}>Discussion of the week's results</Text>
                  </View>
                  <View style={styles.floatingAvatarCluster}>
                    <View style={[styles.tinyAvatar, { backgroundColor: '#18181B' }]}>
                      <Text style={styles.tinyAvatarText}>JH</Text>
                    </View>
                    <View style={[styles.tinyAvatar, { backgroundColor: COLORS.accent, marginLeft: -6 }]}>
                      <Text style={styles.tinyAvatarText}>SW</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Card 2: Discovery Stage */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  if (conversations[1]) router.push(`/(tabs)/inbox/${conversations[1].id}`);
                }}
                style={[styles.streamFloatingCard, { top: 78, left: 70, width: '65%' }]}
              >
                <View style={styles.floatingCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.floatingCardHeading}>Discovery Stage</Text>
                    <Text style={styles.floatingCardSub}>Preparing the research</Text>
                  </View>
                  <View style={styles.floatingAvatarCluster}>
                    <View style={[styles.tinyAvatar, { backgroundColor: '#10B981' }]}>
                      <Text style={styles.tinyAvatarText}>AI</Text>
                    </View>
                    <View style={[styles.tinyAvatar, { backgroundColor: '#27272A', marginLeft: -6 }]}>
                      <Text style={styles.tinyAvatarText}>AL</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Card 3: Agenda Call with John */}
              <View style={[styles.streamDarkMiniCard, { bottom: 10, right: 10 }]}>
                <Text style={styles.miniDarkHeading}>Agenda Call with John</Text>
                <Text style={styles.miniDarkSub}>Project introductory client meeting</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right Stack: Working Hours Stats + Attendance Reports Card */}
        <View style={styles.statsCol}>
          {/* Card 2: Total Working Hours & Payroll Cost */}
          <View style={styles.whiteMetricsCard}>
            <Text style={styles.metricLabel}>Total Working Hours</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricBigNum}>1,678h</Text>
              <View style={styles.greenPill}>
                <Text style={styles.greenPillText}>+3.1% Last month ↑</Text>
              </View>
            </View>

            <View style={styles.metricDivider} />

            <Text style={styles.metricLabel}>Payroll Cost</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricBigNum}>$12.3M</Text>
              <View style={styles.redPill}>
                <Text style={styles.redPillText}>-5.6% Last month ↓</Text>
              </View>
            </View>
          </View>

          {/* Card 3: Attendance Reports Dot Matrix Card */}
          <View style={styles.darkAttendanceCard}>
            <View style={styles.attendanceHeader}>
              <Text style={styles.attendanceTitle}>Attendance Reports</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/agents')}
                style={styles.arrowCircleBtn}
              >
                <Text style={styles.arrowCircleIcon}>↗</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.attendanceNumber}>
              33 <Text style={styles.attendanceSub}>Total</Text>
            </Text>

            {/* Glowing Orange Dot Grid (Exactly matching reference screenshot) */}
            <View style={styles.dotMatrixGrid}>
              {dotMatrix.map((row, rIdx) => (
                <View key={rIdx} style={styles.dotRow}>
                  {row.map((val, cIdx) => (
                    <View
                      key={cIdx}
                      style={[
                        styles.matrixDot,
                        val === 1 ? styles.matrixDotOrange : styles.matrixDotGrey,
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* 3. Bottom Bento Row: Profile Spotlight + Headcount Stack + Expense Statistic Chart */}
      <View style={styles.bentoRow}>
        {/* Card 4: Elisabeth Smith Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
            }}
            style={styles.profileImage}
            resizeMode="cover"
          />

          {/* Floating Badge */}
          <View style={styles.profileExpBadge}>
            <Text style={styles.profileExpText}>8 years experience ✨</Text>
          </View>

          {/* Floating Dark Glass Card */}
          <View style={styles.profileGlassCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>Elisabeth Smith</Text>
              <Text style={styles.profileRole}>Senior UI/UX Designer</Text>
            </View>
            <View style={styles.glassBtnGroup}>
              <TouchableOpacity style={styles.glassCircleBtn}>
                <Text style={styles.glassBtnIconDark}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.glassCircleBtn, styles.glassCircleBtnWhite]}>
                <Text style={styles.glassBtnIcon}>✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Card 5: Head Count + HR Ratio + Team Members Stack */}
        <View style={styles.teamCol}>
          {/* Head Count & HR Ratio side by side */}
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStatCard}>
              <View style={styles.miniStatHeader}>
                <Text style={styles.miniStatLabel}>Head Count</Text>
                <Text style={styles.miniStatIcon}>👤</Text>
              </View>
              <Text style={styles.miniStatNumber}>247</Text>
              <View style={styles.greenMiniBadge}>
                <Text style={styles.greenMiniText}>+3.1% ↑</Text>
              </View>
            </View>

            <View style={styles.miniStatCard}>
              <View style={styles.miniStatHeader}>
                <Text style={styles.miniStatLabel}>HR to Employee</Text>
                <Text style={styles.miniStatIcon}>🎧</Text>
              </View>
              <Text style={styles.miniStatNumber}>46</Text>
              <View style={styles.redMiniBadge}>
                <Text style={styles.redMiniText}>-1.4% ↓</Text>
              </View>
            </View>
          </View>

          {/* Team Members Card with Avatar Stack and Pill Buttons */}
          <View style={styles.teamMembersCard}>
            <View style={styles.teamHeaderRow}>
              <Text style={styles.teamTitle}>Team Members (27)</Text>
              <TouchableOpacity style={styles.teamArrowBtn}>
                <Text style={styles.teamArrowIcon}>›</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.teamSub}>Add or edit your teammates structure...</Text>

            {/* Avatar Stack */}
            <View style={styles.avatarStackRow}>
              <View style={[styles.stackAvatar, { backgroundColor: '#18181B' }]}>
                <Text style={styles.stackAvatarText}>EM</Text>
              </View>
              <View style={[styles.stackAvatar, { backgroundColor: COLORS.accent, marginLeft: -8 }]}>
                <Text style={styles.stackAvatarText}>JK</Text>
              </View>
              <View style={[styles.stackAvatar, { backgroundColor: '#10B981', marginLeft: -8 }]}>
                <Text style={styles.stackAvatarText}>AL</Text>
              </View>
              <View style={[styles.stackAvatar, { backgroundColor: '#3B82F6', marginLeft: -8 }]}>
                <Text style={styles.stackAvatarText}>SW</Text>
              </View>
            </View>

            {/* Actions: + Add new, Manage, ... */}
            <View style={styles.teamActionsRow}>
              <TouchableOpacity style={styles.blackPillBtn}>
                <Text style={styles.blackPillBtnText}>+ Add new</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlinePillBtn}>
                <Text style={styles.outlinePillBtnText}>Manage</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dotsBtn}>
                <Text style={styles.dotsIcon}>•••</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Card 6: Expense Statistic / Bar Chart Card */}
        <View style={styles.expenseCard}>
          <View style={styles.expenseHeaderRow}>
            <View>
              <Text style={styles.expenseTitle}>Expense statistic</Text>
              <Text style={styles.expenseBigNum}>+43,81%</Text>
              <Text style={styles.expenseSub}>Higher digital engagement leads to better business outcomes</Text>
            </View>

            <TouchableOpacity style={styles.halfYearPill}>
              <Text style={styles.halfYearText}>This half-year ▾</Text>
            </TouchableOpacity>
          </View>

          {/* Bento Bar Chart */}
          <View style={styles.chartArea}>
            <View style={styles.dashedRuler} />
            <View style={styles.barsContainer}>
              {/* Bar 1 */}
              <View style={styles.barColumn}>
                <Text style={styles.barLabel}>47%</Text>
                <View style={[styles.barRect, { height: 80, backgroundColor: '#9CA3AF' }]} />
              </View>

              {/* Bar 2: HERO RADIANT ORANGE BAR */}
              <View style={styles.barColumn}>
                <Text style={[styles.barLabel, styles.barLabelOrange]}>71%</Text>
                <View style={[styles.barRect, { height: 120, backgroundColor: COLORS.accent }]} />
              </View>

              {/* Bar 3 */}
              <View style={styles.barColumn}>
                <Text style={styles.barLabel}>33%</Text>
                <View style={[styles.barRect, { height: 50, backgroundColor: '#D1D5DB' }]} />
              </View>

              {/* Bar 4 */}
              <View style={styles.barColumn}>
                <Text style={styles.barLabel}>51%</Text>
                <View style={[styles.barRect, { height: 90, backgroundColor: '#E5E7EB', borderTopWidth: 4, borderTopColor: COLORS.accent }]} />
              </View>

              {/* Bar 5 */}
              <View style={styles.barColumn}>
                <Text style={styles.barLabel}>42%</Text>
                <View style={[styles.barRect, { height: 70, backgroundColor: '#D1D5DB', borderTopWidth: 4, borderTopColor: COLORS.accent }]} />
              </View>

              {/* Bar 6 */}
              <View style={styles.barColumn}>
                <Text style={styles.barLabel}>21%</Text>
                <View style={[styles.barRect, { height: 35, backgroundColor: '#E5E7EB' }]} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Soft light luxury canvas from Omni screenshot
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  // 1. Top Navigation Card
  topNavCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xxl, // 24
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.sm,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  brandDivider: {
    width: 1.5,
    height: 18,
    backgroundColor: '#D1D5DB',
  },
  brandText: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 40,
    minWidth: 240,
    flex: 1,
    maxWidth: 340,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 8,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text,
  },
  keyBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  keyBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textMuted,
  },
  navPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
    borderRadius: RADIUS.full,
    padding: 3,
    gap: 2,
  },
  navPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  navPillActive: {
    backgroundColor: '#18181B', // Pitch Black active pill
    ...SHADOWS.sm,
  },
  navPillText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: COLORS.textMuted,
  },
  navPillTextActive: {
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  utilsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  utilCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  utilIcon: {
    fontSize: 15,
  },
  utilDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 0,
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  titleMeta: {
    flex: 1,
    minWidth: 240,
  },
  dashboardTitle: {
    fontSize: TYPOGRAPHY.size.title,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  dashboardSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  servicesCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  servicesTitle: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textMuted,
  },
  servicesAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servicePill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  serviceIconText: {
    fontSize: 11,
  },
  servicePlus: {
    backgroundColor: COLORS.accent,
  },
  servicePlusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weight.bold,
    lineHeight: 14,
  },
  blackHeaderBtn: {
    backgroundColor: '#18181B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  blackBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  coralHeaderBtn: {
    backgroundColor: COLORS.accent, // Radiant Coral/Orange pill from screenshot
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
  },
  coralBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.bold,
  },

  // Bento Rows
  bentoRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    flexWrap: 'wrap',
  },

  // Card 1: Dark Stream Card
  darkStreamCard: {
    flex: 1.6,
    minWidth: 360,
    backgroundColor: '#18181B', // Deep Matte Charcoal
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#2E2E38',
    ...SHADOWS.md,
  },
  darkHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  darkCardTitle: {
    fontSize: 15,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
  timeDropdownPill: {
    backgroundColor: '#27272A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  timeDropdownText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  timelineArea: {
    flexDirection: 'row',
    height: 190,
    position: 'relative',
  },
  rulerCol: {
    width: 68,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderColor: '#2E2E38',
    paddingRight: 6,
  },
  rulerLabel: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  cardsFloatingCol: {
    flex: 1,
    position: 'relative',
  },
  streamFloatingCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.lg,
  },
  floatingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingCardHeading: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  floatingCardSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  floatingAvatarCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  tinyAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tinyAvatarText: {
    fontSize: 8,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
  streamDarkMiniCard: {
    position: 'absolute',
    backgroundColor: '#27272A',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  miniDarkHeading: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
  miniDarkSub: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Right Stats Stack
  statsCol: {
    flex: 1,
    minWidth: 280,
    gap: SPACING.md,
  },
  whiteMetricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.sm,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textMuted,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  metricBigNum: {
    fontSize: TYPOGRAPHY.size.header,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  greenPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  greenPillText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#065F46',
  },
  redPill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  redPillText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#991B1B',
  },
  metricDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 6,
  },

  // Card 3: Attendance Reports Card
  darkAttendanceCard: {
    backgroundColor: '#18181B',
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#2E2E38',
    ...SHADOWS.md,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendanceTitle: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#9CA3AF',
  },
  arrowCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircleIcon: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  attendanceNumber: {
    fontSize: TYPOGRAPHY.size.title,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
    marginVertical: 4,
  },
  attendanceSub: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: TYPOGRAPHY.weight.regular,
  },
  dotMatrixGrid: {
    marginTop: 8,
    gap: 6,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matrixDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  matrixDotGrey: {
    backgroundColor: '#2E2E38',
  },
  matrixDotOrange: {
    backgroundColor: COLORS.accent, // Glowing radiant coral dot
  },

  // Card 4: Profile Card
  profileCard: {
    width: 220,
    height: 290,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.md,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileExpBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  profileExpText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  profileGlassCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(24, 24, 27, 0.88)',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileName: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
  profileRole: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  glassBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  glassCircleBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3F3F46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCircleBtnWhite: {
    backgroundColor: '#FFFFFF',
  },
  glassBtnIcon: {
    fontSize: 10,
    color: '#18181B',
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  glassBtnIconDark: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.weight.bold,
  },

  // Card 5: Team Col
  teamCol: {
    flex: 1,
    minWidth: 260,
    gap: SPACING.md,
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.sm,
  },
  miniStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textMuted,
  },
  miniStatIcon: {
    fontSize: 13,
  },
  miniStatNumber: {
    fontSize: TYPOGRAPHY.size.title,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    marginVertical: 4,
  },
  greenMiniBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  greenMiniText: {
    fontSize: 10,
    color: '#065F46',
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  redMiniBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  redMiniText: {
    fontSize: 10,
    color: '#991B1B',
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  teamMembersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.sm,
  },
  teamHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamTitle: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  teamArrowBtn: {
    padding: 2,
  },
  teamArrowIcon: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  teamSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginVertical: 4,
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  stackAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stackAvatarText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
  teamActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  blackPillBtn: {
    backgroundColor: '#18181B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  blackPillBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  outlinePillBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  outlinePillBtnText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  dotsBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsIcon: {
    fontSize: 9,
    color: COLORS.textMuted,
  },

  // Card 6: Expense Statistic Card
  expenseCard: {
    flex: 1.4,
    minWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xxl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.sm,
  },
  expenseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  expenseTitle: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textMuted,
  },
  expenseBigNum: {
    fontSize: TYPOGRAPHY.size.metric,
    fontWeight: TYPOGRAPHY.weight.black,
    color: COLORS.text,
    letterSpacing: -1,
    marginVertical: 2,
  },
  expenseSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    maxWidth: 240,
  },
  halfYearPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  halfYearText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: COLORS.text,
  },
  chartArea: {
    marginTop: SPACING.md,
    height: 140,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  dashedRuler: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 130,
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textMuted,
  },
  barLabelOrange: {
    color: COLORS.accent,
  },
  barRect: {
    width: 32,
    borderTopLeftRadius: RADIUS.md,
    borderTopRightRadius: RADIUS.md,
  },
});
