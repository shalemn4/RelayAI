import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useOfflineStore } from '../../store/useOfflineStore';

interface MessageComposerProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  initialText?: string;
  onTextChange?: (text: string) => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  isLoading = false,
  initialText = '',
  onTextChange,
}) => {
  const [text, setText] = useState(initialText);
  const isOnline = useOfflineStore((s) => s.isOnline);

  React.useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  const handleTextChange = (val: string) => {
    setText(val);
    onTextChange?.(val);
  };

  const handleSend = () => {
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText('');
    onTextChange?.('');
  };

  return (
    <View style={styles.container}>
      {!isOnline ? (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>
            ⚡ Offline mode: Reply will be queued and sent automatically when restored.
          </Text>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your response... (Shift+Enter for newline)"
          placeholderTextColor={COLORS.textSubtle}
          multiline
          maxLength={4000}
          value={text}
          onChangeText={handleTextChange}
          editable={!isLoading}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!text.trim() || isLoading}
          onPress={handleSend}
          style={[
            styles.sendBtn,
            (!text.trim() || isLoading) && styles.sendBtnDisabled,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  offlineIndicator: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
  },
  offlineText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F4F5F7',
    borderRadius: RADIUS.xxl, // Smooth rounded pill
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.text,
    maxHeight: 120,
    minHeight: 38,
    paddingTop: 8,
    paddingBottom: 8,
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
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.accent, // Vibrant Electric Orange
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    ...SHADOWS.sm,
  },
  sendBtnDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 2,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
});
