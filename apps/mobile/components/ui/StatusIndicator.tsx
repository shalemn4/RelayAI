import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from '../../constants/theme';

interface StatusIndicatorProps {
  status: 'online' | 'busy' | 'offline' | 'ai_active' | 'human_assigned' | 'live_call';
  label?: string;
  style?: ViewStyle;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, style }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
      case 'ai_active':
        return COLORS.success;
      case 'busy':
      case 'human_assigned':
        return COLORS.warning;
      case 'live_call':
        return COLORS.danger;
      default:
        return COLORS.textSubtle;
    }
  };

  const color = getStatusColor();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.dotWrapper]}>
        <View style={[styles.pulse, { backgroundColor: color, opacity: 0.25 }]} />
        <View style={[styles.dot, { backgroundColor: color }]} />
      </View>
      {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotWrapper: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
});
