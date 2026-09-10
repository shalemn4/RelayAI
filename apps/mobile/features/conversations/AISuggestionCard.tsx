import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AISuggestion } from '@relay-ai/types';
import { Button } from '../../components/ui/Button';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  isGenerating?: boolean;
  onAccept: (text: string) => void;
  onEdit: (text: string) => void;
  onRegenerate: () => void;
  onReject: () => void;
}

export const AISuggestionCard: React.FC<AISuggestionCardProps> = ({
  suggestion,
  isGenerating = false,
  onAccept,
  onEdit,
  onRegenerate,
  onReject,
}) => {
  const [showReasoning, setShowReasoning] = useState(false);

  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.9) return { label: 'High Confidence', color: COLORS.success };
    if (conf >= 0.75) return { label: 'Moderate Confidence', color: COLORS.warning };
    return { label: 'Low Confidence', color: COLORS.danger };
  };

  const { label: confLabel, color: confColor } = getConfidenceLevel(suggestion.confidence);

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.aiSparkle}>✨</Text>
          <Text style={styles.title}>AI Suggested Response</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{suggestion.category}</Text>
          </View>
        </View>

        {/* Confidence pill */}
        <View style={styles.confidencePill}>
          <View style={[styles.confidenceDot, { backgroundColor: confColor }]} />
          <Text style={[styles.confidenceText, { color: confColor }]}>
            {Math.round(suggestion.confidence * 100)}% {confLabel}
          </Text>
        </View>
      </View>

      {/* Suggested text body */}
      <View style={[styles.body, isGenerating && styles.bodyGenerating]}>
        <Text style={[styles.responseText, isGenerating && styles.responseTextGenerating]}>
          {isGenerating ? '✨ Drafting intelligent alternative response...' : suggestion.text}
        </Text>
      </View>

      {/* Reasoning trace collapsible */}
      {suggestion.reasoning_steps && suggestion.reasoning_steps.length > 0 ? (
        <View style={styles.reasoningContainer}>
          <TouchableOpacity
            onPress={() => setShowReasoning(!showReasoning)}
            style={styles.reasoningToggle}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.reasoningToggleText}>
              {showReasoning ? '▼ Hide AI Reasoning Traces' : '▶ Show AI Reasoning Traces'}
            </Text>
          </TouchableOpacity>
          {showReasoning ? (
            <View style={styles.reasoningList}>
              {suggestion.reasoning_steps.map((step, idx) => (
                <View key={idx} style={styles.reasoningItem}>
                  <Text style={styles.reasoningBullet}>•</Text>
                  <Text style={styles.reasoningText}>{step}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <Button
          title="Send ➤"
          variant="accent"
          size="sm"
          disabled={isGenerating}
          onPress={() => onAccept(suggestion.text)}
          style={styles.actionBtnPrimary}
        />
        <Button
          title="Edit"
          variant="outline"
          size="sm"
          disabled={isGenerating}
          onPress={() => onEdit(suggestion.text)}
          style={styles.actionBtn}
        />
        <Button
          title={isGenerating ? "Regenerating..." : "Regenerate"}
          variant="ghost"
          size="sm"
          loading={isGenerating}
          disabled={isGenerating}
          onPress={onRegenerate}
          style={styles.actionBtn}
        />
        <TouchableOpacity
          onPress={onReject}
          disabled={isGenerating}
          style={[styles.rejectBtn, isGenerating && { opacity: 0.4 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.rejectText}>✕ Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8F5', // Soft warm cream orange
    borderRadius: RADIUS.xxl, // 24
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiSparkle: {
    fontSize: 15,
  },
  title: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#9A3412', // Orange 800
  },
  categoryBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.accent,
  },
  confidencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 5,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  body: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  bodyGenerating: {
    opacity: 0.75,
    backgroundColor: '#FFFDFB',
    borderColor: '#FED7AA',
  },
  responseText: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.text,
    lineHeight: 22,
  },
  responseTextGenerating: {
    fontStyle: 'italic',
    color: COLORS.textMuted,
  },
  reasoningContainer: {
    marginBottom: SPACING.sm,
  },
  reasoningToggle: {
    paddingVertical: 2,
  },
  reasoningToggleText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  reasoningList: {
    marginTop: SPACING.xs,
    backgroundColor: '#FFFBEB',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reasoningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 2,
  },
  reasoningBullet: {
    color: COLORS.accent,
    fontSize: 12,
  },
  reasoningText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: '#78350F',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionBtnPrimary: {
    minWidth: 85,
  },
  actionBtn: {
    paddingHorizontal: SPACING.md,
  },
  rejectBtn: {
    marginLeft: 'auto',
    paddingHorizontal: SPACING.sm,
  },
  rejectText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
});
