import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'outlined',
  padding = 'md',
  style,
  onPress,
  ...props
}) => {
  const getContainerStyles = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base];

    if (variant === 'elevated') {
      list.push(styles.elevated);
    } else if (variant === 'outlined') {
      list.push(styles.outlined);
    } else {
      list.push(styles.flat);
    }

    if (padding === 'sm') list.push(styles.padding_sm);
    else if (padding === 'md') list.push(styles.padding_md);
    else if (padding === 'lg') list.push(styles.padding_lg);

    if (style) list.push(style as any);

    return list;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={getContainerStyles()}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={getContainerStyles()}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
  },
  elevated: {
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  flat: {
    backgroundColor: COLORS.surfaceSubtle,
  },
  padding_sm: {
    padding: SPACING.sm,
  },
  padding_md: {
    padding: SPACING.md,
  },
  padding_lg: {
    padding: SPACING.lg,
  },
});
