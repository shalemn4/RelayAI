import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Conversation } from '@relay-ai/types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

interface ConversationCardProps {
  conversation: Conversation;
  onPress: () => void;
  isSelected?: boolean;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onPress,
  isSelected,
}) => {
  const formatTime = (iso: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getSentimentDot = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return COLORS.success;
      case 'negative':
        return COLORS.danger;
      default:
        return COLORS.textSubtle;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        conversation.unread_count > 0 && styles.unreadCard,
      ]}
    >
      <View style={styles.leftCol}>
        <Avatar
          name={conversation.customer.name}
          url={conversation.customer.avatar_url}
          size="md"
        />
        <View
          style={[
            styles.sentimentDot,
            { backgroundColor: getSentimentDot(conversation.sentiment) },
          ]}
        />
      </View>

      <View style={styles.centerCol}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.customerName,
              conversation.unread_count > 0 && styles.textBold,
            ]}
            numberOfLines={1}
          >
            {conversation.customer.name}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(conversation.last_activity_at)}
          </Text>
        </View>

        <Text style={styles.companyText} numberOfLines={1}>
          {conversation.customer.company}
        </Text>

        <Text
          style={[
            styles.previewText,
            conversation.unread_count > 0 && styles.unreadPreview,
          ]}
          numberOfLines={2}
        >
          {conversation.last_message_preview || 'No messages yet'}
        </Text>

        <View style={styles.badgesRow}>
          <Badge type="channel" value={conversation.channel} label={conversation.channel} />
          <Badge type="status" value={conversation.status} label={conversation.status} dot />
          {conversation.lead_stage ? (
            <Badge type="lead_stage" value={conversation.lead_stage} label={conversation.lead_stage} />
          ) : null}
          {conversation.priority === 'urgent' || conversation.priority === 'high' ? (
            <Badge type="priority" value={conversation.priority} label={conversation.priority} />
          ) : null}
        </View>
      </View>

      {conversation.unread_count > 0 ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCountText}>{conversation.unread_count}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl, // 20
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-start',
    marginHorizontal: SPACING.md,
    marginVertical: 4,
    ...SHADOWS.sm,
  },
  selectedCard: {
    backgroundColor: '#FFF8F5',
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FED7AA',
  },
  leftCol: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  sentimentDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  centerCol: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  companyText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textSubtle,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  previewText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  unreadPreview: {
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  textBold: {
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  unreadBadge: {
    backgroundColor: COLORS.accent, // Electric radiant orange
    borderRadius: RADIUS.full,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    alignSelf: 'center',
    ...SHADOWS.sm,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
});
