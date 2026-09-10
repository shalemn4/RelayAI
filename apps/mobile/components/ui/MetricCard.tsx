import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Card } from './Card';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/theme';

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  suffix?: string;
  icon?: string;
  subtext?: string;
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  delta,
  deltaLabel = 'vs prev period',
  suffix = '',
  icon,
  subtext,
  style,
}) => {
  const isPositive = delta !== undefined && delta >= 0;
  const deltaColor = isPositive ? COLORS.success : COLORS.danger;
  const deltaBg = isPositive ? COLORS.successBg : COLORS.dangerBg;

  return (
    <Card variant="elevated" padding="md" style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>
          {value}
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </Text>
      </View>
      <View style={styles.footer}>
        {delta !== undefined ? (
          <View style={[styles.deltaBadge, { backgroundColor: deltaBg }]}>
            <Text style={[styles.deltaText, { color: deltaColor }]}>
              {isPositive ? '↑ +' : '↓ '}
              {Math.abs(delta)}%
            </Text>
          </View>
        ) : null}
        <Text style={styles.subtext}>{subtext || deltaLabel}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    minWidth: 150,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: COLORS.textMuted,
  },
  icon: {
    fontSize: 16,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: SPACING.xs,
  },
  value: {
    fontSize: TYPOGRAPHY.size.title,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  suffix: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  deltaBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  deltaText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  subtext: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSubtle,
  },
});
