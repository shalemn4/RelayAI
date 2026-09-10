import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Avatar } from '../ui/Avatar';
import { SpotlightSearchModal } from './SpotlightSearchModal';

interface NavTab {
  id: string;
  label: string;
  path: string;
}

const NAV_TABS: NavTab[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/(tabs)/dashboard' },
  { id: 'inbox', label: 'Inbox', path: '/(tabs)/inbox' },
  { id: 'leads', label: 'Leads', path: '/(tabs)/leads' },
  { id: 'calls', label: 'Voice AI', path: '/(tabs)/calls' },
  { id: 'analytics', label: 'Analytics', path: '/(tabs)/analytics' },
  { id: 'agents', label: 'AI Agents', path: '/(tabs)/agents' },
];

export function TopNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  // Global shortcut for Cmd+K / Ctrl+K / Cmd+F / Ctrl+F
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'f')) {
        e.preventDefault();
        setIsSpotlightOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isTabActive = (tabId: string) => {
    if (tabId === 'dashboard') {
      return (
        pathname === '/dashboard' ||
        pathname === '/' ||
        pathname.endsWith('/dashboard') ||
        pathname === '/(tabs)'
      );
    }
    return pathname.includes(`/${tabId}`);
  };

  const handleSearchSubmit = () => {
    if (search.trim()) {
      router.push({
        pathname: '/(tabs)/inbox',
        params: { search: search.trim() },
      });
    } else {
      setIsSpotlightOpen(true);
    }
  };

  return (
    <>
      <View style={styles.navContainer}>
        <View style={styles.navInner}>
          {/* 1. Left: Brand Logo & Identifier */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/dashboard')}
            style={styles.brandRow}
          >
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>⚡</Text>
            </View>
            <View style={styles.brandDivider} />
            <Text style={styles.brandText}>RelayAI</Text>
          </TouchableOpacity>

          {/* 2. Functional & Refined Search Pill */}
          <View
            style={[
              styles.searchPill,
              isFocused && styles.searchPillFocused,
            ]}
          >
            <TouchableOpacity
              onPress={() => setIsSpotlightOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.searchIcon}>🔍</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.searchInput}
              placeholder="Start searching here..."
              placeholderTextColor={COLORS.textSubtle}
              value={search}
              onChangeText={setSearch}
              onFocus={() => {
                setIsFocused(true);
              }}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />

            {/* Clickable ⌘F Spotlight Trigger */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsSpotlightOpen(true)}
              style={styles.keyBadge}
            >
              <Text style={styles.keyBadgeText}>⌘F</Text>
            </TouchableOpacity>
          </View>

          {/* 3. Center: Image 1 Navigation Pill Bar */}
          <View style={styles.navPillsOuter}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.navPillsRow}
            >
              {NAV_TABS.map((tab) => {
                const active = isTabActive(tab.id);
                return (
                  <TouchableOpacity
                    key={tab.id}
                    activeOpacity={0.75}
                    onPress={() => router.push(tab.path as any)}
                    style={[styles.navPill, active && styles.navPillActive]}
                  >
                    <Text style={[styles.navPillText, active && styles.navPillTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 4. Right: Quick Action Utilities */}
          <View style={styles.utilsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/settings')}
              style={[
                styles.utilCircle,
                pathname.includes('/settings') && styles.utilCircleActive,
              ]}
            >
              <Text style={styles.utilIcon}>⚙️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/inbox')}
              style={styles.utilCircle}
            >
              <Text style={styles.utilIcon}>🔔</Text>
              <View style={styles.utilDot} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/settings')}
              style={styles.avatarBtn}
            >
              <Avatar name={user?.name || 'Jordan Hayes'} size="sm" online />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Interactive Spotlight & Command Palette Modal */}
      <SpotlightSearchModal
        visible={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        initialQuery={search}
      />
    </>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    zIndex: 100,
    ...SHADOWS.sm,
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center',
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
    borderRadius: RADIUS.md,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: {
    fontSize: 16,
    color: '#FF5520',
  },
  brandDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#D1D5DB',
  },
  brandText: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.black,
    color: '#18181B',
    letterSpacing: -0.5,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 7 : 5,
    minWidth: 240,
    maxWidth: 320,
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchPillFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#18181B',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 8,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#18181B',
    paddingVertical: 2,
    paddingHorizontal: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
        }
      : {}),
  } as any,
  keyBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  keyBadgeText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#374151',
  },
  navPillsOuter: {
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.full,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  navPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  navPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  navPillActive: {
    backgroundColor: '#18181B', // Deep pitch black active pill
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  navPillText: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: '#64748B', // Muted slate grey
  },
  navPillTextActive: {
    color: '#FFFFFF', // High contrast crisp white
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  utilsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  utilCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  utilCircleActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  utilIcon: {
    fontSize: 14,
  },
  utilDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF5520', // Radiant coral notification dot
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  avatarBtn: {
    marginLeft: 2,
  },
});
