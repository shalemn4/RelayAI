import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ViewStyle, Platform } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmitEditing?: () => void;
  style?: ViewStyle;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search conversations, leads, customers...',
  onClear,
  onSubmitEditing,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, isFocused && styles.containerFocused, style]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSubtle}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSubmitEditing}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {value ? (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clearBtn}
        >
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.full, // Refined rounded pill
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  containerFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#18181B', // Crisp black border on focus
    borderWidth: 1.5,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.text,
    paddingVertical: 8,
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
  clearBtn: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
