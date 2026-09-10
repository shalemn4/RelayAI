import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../store/useAuthStore';
import { Avatar } from '../../../components/ui/Avatar';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../constants/theme';
import { useToast } from '../../../components/ui/Toast';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();

  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [realtimeTelemetry, setRealtimeTelemetry] = useState(true);

  const handleLogout = () => {
    logout();
    showToast('Signed out of RelayAI', 'info');
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerWrapper}>
        {/* Page Title & Intro */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>⚙️ Operator Settings & Telemetry</Text>
          <Text style={styles.pageSubtitle}>
            Configure your workspace preferences, triage automation rules, and review live architecture telemetry.
          </Text>
        </View>

        {/* 1. Operator Profile Bento Card */}
        <View style={styles.bentoCard}>
          <View style={styles.profileRow}>
            <Avatar name={user?.name || 'Jordan Hayes'} size="lg" online />
            <View style={styles.profileMeta}>
              <View style={styles.profileNameRow}>
                <Text style={styles.userName}>{user?.name || 'Jordan Hayes'}</Text>
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Active Now</Text>
                </View>
              </View>
              <Text style={styles.userEmail}>{user?.email || 'operator@relayai.com'}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{(user?.role || 'operator').toUpperCase()}</Text>
                </View>
                <View style={styles.orgBadge}>
                  <Text style={styles.orgText}>RelayAI Enterprise Fleet</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => showToast('Profile details up to date', 'info')}
              style={styles.editProfileBtn}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Workflow & Automation Preferences */}
        <View style={styles.bentoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>WORKFLOW & AUTOMATION</Text>
            <Text style={styles.sectionSubtitle}>
              Configure AI suggestion triggers, alert sounds, and operator takeover behavior.
            </Text>
          </View>

          <View style={styles.settingsList}>
            {/* Setting 1 */}
            <View style={styles.settingItem}>
              <View style={styles.settingIconBox}>
                <Text style={styles.settingIcon}>🤖</Text>
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Auto-Generate AI Suggestions</Text>
                <Text style={styles.settingDesc}>
                  Automatically draft intelligent reply suggestions when customer inquiries arrive.
                </Text>
              </View>
              <Switch
                value={autoSuggest}
                onValueChange={setAutoSuggest}
                trackColor={{ false: '#E5E7EB', true: COLORS.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Setting 2 */}
            <View style={styles.settingDivider} />
            <View style={styles.settingItem}>
              <View style={styles.settingIconBox}>
                <Text style={styles.settingIcon}>🔔</Text>
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Sound & Alert Chimes</Text>
                <Text style={styles.settingDesc}>
                  Play audio alerts on escalated customer tickets or live voice supervisor handoffs.
                </Text>
              </View>
              <Switch
                value={soundAlerts}
                onValueChange={setSoundAlerts}
                trackColor={{ false: '#E5E7EB', true: COLORS.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Setting 3 */}
            <View style={styles.settingDivider} />
            <View style={styles.settingItem}>
              <View style={styles.settingIconBox}>
                <Text style={styles.settingIcon}>⚡</Text>
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Haptic & Tactile Feedback</Text>
                <Text style={styles.settingDesc}>
                  Subtle confirmation vibration when approving AI suggestions or reassigning threads.
                </Text>
              </View>
              <Switch
                value={hapticFeedback}
                onValueChange={setHapticFeedback}
                trackColor={{ false: '#E5E7EB', true: COLORS.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Setting 4 */}
            <View style={styles.settingDivider} />
            <View style={styles.settingItem}>
              <View style={styles.settingIconBox}>
                <Text style={styles.settingIcon}>📡</Text>
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingLabel}>Live WebSocket Streaming</Text>
                <Text style={styles.settingDesc}>
                  Stream live speech transcript utterances and real-time conversation updates.
                </Text>
              </View>
              <Switch
                value={realtimeTelemetry}
                onValueChange={setRealtimeTelemetry}
                trackColor={{ false: '#E5E7EB', true: COLORS.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* 3. System Telemetry & Engineering Architecture */}
        <View style={styles.bentoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>SYSTEM TELEMETRY & RUNTIME</Text>
            <Text style={styles.sectionSubtitle}>
              Active frontend engine specifications, caching layers, and database connectors.
            </Text>
          </View>

          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryRow}>
              <View style={styles.telemetryLabelCol}>
                <Text style={styles.telemetryName}>Frontend Runtime</Text>
                <Text style={styles.telemetryDetail}>React Native / Expo SDK 57 (Expo Router)</Text>
              </View>
              <View style={styles.statusPillGreen}>
                <Text style={styles.statusTextGreen}>READY</Text>
              </View>
            </View>

            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryRow}>
              <View style={styles.telemetryLabelCol}>
                <Text style={styles.telemetryName}>Client State & Cache</Text>
                <Text style={styles.telemetryDetail}>TanStack Query v5 with Optimistic Reconcile</Text>
              </View>
              <View style={styles.statusPillGreen}>
                <Text style={styles.statusTextGreen}>ACTIVE</Text>
              </View>
            </View>

            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryRow}>
              <View style={styles.telemetryLabelCol}>
                <Text style={styles.telemetryName}>Realtime Transport</Text>
                <Text style={styles.telemetryDetail}>WebSocket Hub (ws://localhost:8000/ws)</Text>
              </View>
              <View style={styles.statusPillGreen}>
                <Text style={styles.statusTextGreen}>CONNECTED 🟢</Text>
              </View>
            </View>

            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryRow}>
              <View style={styles.telemetryLabelCol}>
                <Text style={styles.telemetryName}>Safe Filter AST</Text>
                <Text style={styles.telemetryDetail}>Parameterized SQLAlchemy Binary Compiler</Text>
              </View>
              <View style={styles.statusPillOrange}>
                <Text style={styles.statusTextOrange}>SQL INJECT SAFE</Text>
              </View>
            </View>

            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryRow}>
              <View style={styles.telemetryLabelCol}>
                <Text style={styles.telemetryName}>Seeded Database</Text>
                <Text style={styles.telemetryDetail}>SQLite WAL Mode (30 Customers, 50 Conversations)</Text>
              </View>
              <View style={styles.statusPillGrey}>
                <Text style={styles.statusTextGrey}>SYNCED</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Session Management (Refined, proportional card) */}
        <View style={[styles.bentoCard, styles.dangerCard]}>
          <View style={styles.sessionRow}>
            <View style={styles.sessionInfoCol}>
              <Text style={styles.sessionTitle}>Session Management</Text>
              <Text style={styles.sessionDesc}>
                Logged in as {user?.email || 'operator@relayai.com'}. Sign out to terminate your current workstation session.
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogout}
              style={styles.signOutBtn}
            >
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Luxury light grey canvas
  },
  contentContainer: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  centerWrapper: {
    maxWidth: 920, // Perfect proportional width on large screens
    width: '100%',
    alignSelf: 'center',
    gap: SPACING.lg,
  },
  pageHeader: {
    marginBottom: SPACING.xs,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#111827',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  bentoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xxl, // 24
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: SPACING.xl,
    ...SHADOWS.sm,
  },
  // Profile Card
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    flexWrap: 'wrap',
  },
  profileMeta: {
    flex: 1,
    minWidth: 240,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#111827',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#065F46',
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginVertical: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: '#FFF2ED',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FFD7CA',
  },
  roleText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FF5520',
  },
  orgBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orgText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: '#4B5563',
  },
  editProfileBtn: {
    backgroundColor: '#F4F5F7',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: '#374151',
  },
  // Card Sections
  cardHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#9CA3AF',
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  settingsList: {
    gap: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 14,
  },
  settingIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.lg,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIcon: {
    fontSize: 16,
  },
  settingTextCol: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: '#111827',
  },
  settingDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  // Telemetry Rows
  telemetryGrid: {
    gap: 4,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  telemetryLabelCol: {
    flex: 1,
  },
  telemetryName: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: '#111827',
  },
  telemetryDetail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  telemetryDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  statusPillGreen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusTextGreen: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#065F46',
  },
  statusPillOrange: {
    backgroundColor: '#FFF2ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FFD7CA',
  },
  statusTextOrange: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FF5520',
  },
  statusPillGrey: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusTextGrey: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#4B5563',
  },
  // Danger Card
  dangerCard: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFFDFD',
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  sessionInfoCol: {
    flex: 1,
    minWidth: 260,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#111827',
  },
  sessionDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  signOutBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  signOutBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
});
