import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'ai' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  disabled,
  style,
  textStyle,
  ...props
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [styles.base, styles[`size_${size}`]];

    if (fullWidth) base.push(styles.fullWidth);

    switch (variant) {
      case 'primary':
        base.push(styles.primary);
        break;
      case 'secondary':
        base.push(styles.secondary);
        break;
      case 'outline':
        base.push(styles.outline);
        break;
      case 'destructive':
        base.push(styles.destructive);
        break;
      case 'ghost':
        base.push(styles.ghost);
        break;
      case 'ai':
      case 'accent':
        base.push(styles.accent);
        break;
    }

    if (disabled || loading) {
      base.push(styles.disabled);
    }

    if (style) base.push(style);

    return base;
  };

  const getTextStyle = (): TextStyle[] => {
    const base: TextStyle[] = [styles.text, styles[`textSize_${size}`]];

    switch (variant) {
      case 'primary':
        base.push(styles.textPrimary);
        break;
      case 'secondary':
        base.push(styles.textSecondary);
        break;
      case 'outline':
        base.push(styles.textOutline);
        break;
      case 'destructive':
        base.push(styles.textDestructive);
        break;
      case 'ghost':
        base.push(styles.textGhost);
        break;
      case 'ai':
      case 'accent':
        base.push(styles.textAccent);
        break;
    }

    if (textStyle) base.push(textStyle);

    return base;
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: loading }}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={getContainerStyle()}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : '#FFFFFF'}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={getTextStyle()}>{title}</Text>
          {iconRight ? <>{iconRight}</> : null}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full, // Smooth pill shapes like Omni UI
    gap: SPACING.sm,
  },
  fullWidth: {
    width: '100%',
  },
  size_sm: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    minHeight: 34,
  },
  size_md: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    minHeight: 42,
  },
  size_lg: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 50,
  },
  primary: {
    backgroundColor: COLORS.primary, // Pitch Black pill
    ...SHADOWS.sm,
  },
  secondary: {
    backgroundColor: '#F4F5F7',
  },
  outline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  destructive: {
    backgroundColor: COLORS.danger,
    ...SHADOWS.sm,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  accent: {
    backgroundColor: COLORS.accent, // Electric radiant orange pill
    ...SHADOWS.md,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: TYPOGRAPHY.weight.bold,
    textAlign: 'center',
  },
  textSize_sm: {
    fontSize: 12,
  },
  textSize_md: {
    fontSize: TYPOGRAPHY.size.base,
  },
  textSize_lg: {
    fontSize: TYPOGRAPHY.size.md,
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: COLORS.text,
  },
  textOutline: {
    color: COLORS.text,
  },
  textDestructive: {
    color: '#FFFFFF',
  },
  textGhost: {
    color: COLORS.text,
  },
  textAccent: {
    color: '#FFFFFF',
  },
});
