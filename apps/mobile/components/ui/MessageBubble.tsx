import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Message } from '@relay-ai/types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

interface MessageBubbleProps {
  message: Message;
  onRetry?: (tempId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const isHuman = message.sender_role === 'human';
  const isAI = message.sender_role === 'ai';
  const isCustomer = message.sender_role === 'customer';
  const isSystem = message.sender_role === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  const renderStatusIndicator = () => {
    if (!isHuman) return null;

    if (message.status === 'waiting_to_send') {
      return (
        <View style={styles.statusRow}>
          <Text style={styles.statusTextWaiting}>⏳ Waiting</Text>
        </View>
      );
    }
    if (message.status === 'sending') {
      return (
        <View style={styles.statusRow}>
          <Text style={styles.statusTextSending}>● Sending...</Text>
        </View>
      );
    }
    if (message.status === 'failed') {
      return (
        <TouchableOpacity
          onPress={() => onRetry?.(String(message.id))}
          style={styles.retryRow}
        >
          <Text style={styles.statusTextFailed}>⚠️ Failed. Tap to retry</Text>
        </TouchableOpacity>
      );
    }
    if (message.status === 'delivered') {
      return <Text style={styles.statusCheck}>✓✓</Text>;
    }
    return <Text style={styles.statusCheck}>✓</Text>;
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View
      style={[
        styles.row,
        isHuman ? styles.rowRight : styles.rowLeft,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isHuman && styles.bubbleHuman,
          isAI && styles.bubbleAI,
          isCustomer && styles.bubbleCustomer,
        ]}
      >
        {/* Header with sender name and AI confidence badge */}
        <View style={styles.header}>
          <Text
            style={[
              styles.senderName,
              isHuman ? styles.textInverseMuted : styles.textMuted,
            ]}
          >
            {message.sender_name || (isHuman ? 'Operator' : isAI ? 'AI Assistant' : 'Customer')}
          </Text>
          {isAI && message.metadata?.confidence ? (
            <View style={styles.aiConfidenceBadge}>
              <Text style={styles.aiConfidenceText}>
                ✨ {Math.round(message.metadata.confidence * 100)}% Conf
              </Text>
            </View>
          ) : null}
        </View>

        {/* Message content */}
        <Text
          style={[
            styles.content,
            isHuman ? styles.contentHuman : styles.contentDefault,
          ]}
        >
          {message.content}
        </Text>

        {/* Footer with timestamp & status */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.timestamp,
              isHuman ? styles.textInverseSubtle : styles.textSubtle,
            ]}
          >
            {formatTime(message.created_at)}
          </Text>
          {renderStatusIndicator()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: RADIUS.xl, // 20
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    ...SHADOWS.sm,
  },
  bubbleHuman: {
    backgroundColor: '#18181B', // Charcoal Slate 900
    borderBottomRightRadius: 4,
  },
  bubbleCustomer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubbleAI: {
    backgroundColor: '#FFF8F5', // Soft Warm Cream Orange
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderBottomLeftRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: SPACING.sm,
  },
  senderName: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  textMuted: {
    color: COLORS.textMuted,
  },
  textInverseMuted: {
    color: '#A1A1AA',
  },
  aiConfidenceBadge: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  aiConfidenceText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.accent,
  },
  content: {
    fontSize: TYPOGRAPHY.size.base,
    lineHeight: 21,
  },
  contentHuman: {
    color: '#FFFFFF',
  },
  contentDefault: {
    color: COLORS.text,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 6,
  },
  timestamp: {
    fontSize: 10,
  },
  textSubtle: {
    color: COLORS.textSubtle,
  },
  textInverseSubtle: {
    color: '#71717A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextWaiting: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  statusTextSending: {
    fontSize: 10,
    color: COLORS.accent,
  },
  retryRow: {
    paddingVertical: 2,
  },
  statusTextFailed: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: TYPOGRAPHY.weight.bold,
    textDecorationLine: 'underline',
  },
  statusCheck: {
    fontSize: 10,
    color: '#71717A',
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  systemBubble: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  systemText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
