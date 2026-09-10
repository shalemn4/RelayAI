import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

export interface QuickFilterOption {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

const DEFAULT_FILTERS: QuickFilterOption[] = [
  { id: 'all', label: 'All Conversations' },
  { id: 'unread', label: 'Unread', icon: '📬' },
  { id: 'ai_active', label: 'AI Active', icon: '🤖' },
  { id: 'human_assigned', label: 'Assigned to Me', icon: '👤' },
  { id: 'escalated', label: 'Escalated', icon: '🚨' },
  { id: 'sms', label: 'SMS' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

interface FilterChipsProps {
  activeFilter: string;
  onSelect: (filterId: string) => void;
  options?: QuickFilterOption[];
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  activeFilter,
  onSelect,
  options = DEFAULT_FILTERS,
}) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => {
          const isActive = activeFilter === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.8}
              onPress={() => onSelect(option.id)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              {option.icon ? <Text style={styles.icon}>{option.icon}</Text> : null}
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {option.label}
              </Text>
              {option.count !== undefined ? (
                <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                  <Text style={[styles.countText, isActive && styles.countTextActive]}>
                    {option.count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: SPACING.sm,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full, // Pill
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    ...SHADOWS.sm,
  },
  chipActive: {
    backgroundColor: COLORS.primary, // Black pill from screenshot
    borderColor: COLORS.primary,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textMuted,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  countBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  countTextActive: {
    color: '#FFFFFF',
  },
});
