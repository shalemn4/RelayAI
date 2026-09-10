import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../components/ui/Button';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

interface TakeoverBannerProps {
  status: string;
  onTakeover: () => void;
  onReturnToAI: () => void;
  isLoading?: boolean;
}

export const TakeoverBanner: React.FC<TakeoverBannerProps> = ({
  status,
  onTakeover,
  onReturnToAI,
  isLoading = false,
}) => {
  const isHuman = status === 'human_assigned';

  return (
    <View style={[styles.container, isHuman ? styles.humanBg : styles.aiBg]}>
      <View style={styles.textContainer}>
        <View style={[styles.iconCircle, isHuman ? styles.humanIconCircle : styles.aiIconCircle]}>
          <Text style={styles.icon}>{isHuman ? '👤' : '🤖'}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.title}>
            {isHuman ? 'Human Takeover Active' : 'Autonomous AI Active'}
          </Text>
          <Text style={styles.subtext}>
            {isHuman
              ? 'AI automated replies are paused. You own this conversation.'
              : 'AI agent is handling routine messages and drafting suggestions.'}
          </Text>
        </View>
      </View>

      {isHuman ? (
        <Button
          title="Return to AI"
          variant="outline"
          size="sm"
          loading={isLoading}
          onPress={onReturnToAI}
          style={styles.actionBtn}
        />
      ) : (
        <Button
          title="Take Over"
          variant="primary"
          size="sm"
          loading={isLoading}
          onPress={onTakeover}
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  aiBg: {
    backgroundColor: '#FFF8F5',
    borderColor: '#FED7AA',
  },
  humanBg: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIconCircle: {
    backgroundColor: '#FFEDD5',
  },
  humanIconCircle: {
    backgroundColor: '#FEF3C7',
  },
  icon: {
    fontSize: 15,
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  subtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },
  actionBtn: {
    minWidth: 100,
  },
});
