import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from '../../constants/theme';

export type BadgeType =
  | 'channel'
  | 'status'
  | 'sentiment'
  | 'priority'
  | 'lead_stage'
  | 'custom';

interface BadgeProps {
  label: string;
  type?: BadgeType;
  value?: string;
  dot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  type = 'custom',
  value,
  dot = false,
  style,
  textStyle,
}) => {
  const getBadgeColors = (): { bg: string; text: string; dotColor?: string } => {
    const key = (value || label).toLowerCase();

    // Channels
    if (key === 'sms') return { bg: '#ECFDF5', text: '#065F46', dotColor: '#10B981' };
    if (key === 'whatsapp') return { bg: '#DCFCE7', text: '#14532D', dotColor: '#22C55E' };
    if (key === 'email') return { bg: '#FFF2ED', text: '#C2410C', dotColor: '#FF5520' };
    if (key === 'webchat') return { bg: '#F3F4F6', text: '#374151', dotColor: '#6B7280' };

    // Statuses
    if (key === 'ai_active') return { bg: '#FFF2ED', text: '#C2410C', dotColor: '#FF5520' };
    if (key === 'human_assigned') return { bg: '#FEF3C7', text: '#92400E', dotColor: '#F59E0B' };
    if (key === 'escalated') return { bg: '#FEE2E2', text: '#991B1B', dotColor: '#EF4444' };
    if (key === 'resolved') return { bg: '#F3F4F6', text: '#4B5563', dotColor: '#9CA3AF' };

    // Sentiments
    if (key === 'positive') return { bg: '#ECFDF5', text: '#065F46', dotColor: '#10B981' };
    if (key === 'neutral') return { bg: '#F3F4F6', text: '#4B5563', dotColor: '#6B7280' };
    if (key === 'negative') return { bg: '#FEE2E2', text: '#991B1B', dotColor: '#EF4444' };

    // Priorities
    if (key === 'urgent') return { bg: '#FEE2E2', text: '#991B1B', dotColor: '#EF4444' };
    if (key === 'high') return { bg: '#FFF2ED', text: '#C2410C', dotColor: '#FF5520' };
    if (key === 'normal') return { bg: '#F3F4F6', text: '#4B5563' };
    if (key === 'low') return { bg: '#F9FAFB', text: '#6B7280' };

    // Lead Stages
    if (key === 'won') return { bg: '#DCFCE7', text: '#15803D', dotColor: '#22C55E' };
    if (key === 'qualified' || key === 'demo') return { bg: '#FFF2ED', text: '#C2410C', dotColor: '#FF5520' };
    if (key === 'new' || key === 'contacted') return { bg: '#F3F4F6', text: '#374151', dotColor: '#9CA3AF' };
    if (key === 'lost') return { bg: '#FEE2E2', text: '#991B1B', dotColor: '#EF4444' };

    return { bg: '#F3F4F6', text: COLORS.textMuted };
  };

  const { bg, text, dotColor } = getBadgeColors();

  return (
    <View style={[styles.container, { backgroundColor: bg }, style]}>
      {dot && dotColor ? (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      ) : null}
      <Text style={[styles.text, { color: text }, textStyle]}>
        {label.replace('_', ' ').toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.full, // Pill
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    letterSpacing: 0.4,
  },
});
