import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

interface AvatarProps {
  name: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  url,
  size = 'md',
  online,
  style,
}) => {
  const getInitials = (n: string) => {
    const parts = (n || '').trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (n || 'U').substring(0, 2).toUpperCase();
  };

  const getDimension = () => {
    if (size === 'sm') return 32;
    if (size === 'lg') return 48;
    return 40;
  };

  const dim = getDimension();

  return (
    <View style={[styles.wrapper, { width: dim, height: dim }, style]}>
      {url && !url.includes('dicebear') ? (
        <Image
          source={{ uri: url }}
          style={{ width: dim, height: dim, borderRadius: dim / 2 }}
        />
      ) : (
        <View style={[styles.initialsContainer, { width: dim, height: dim, borderRadius: dim / 2 }]}>
          <Text style={[styles.initials, { fontSize: dim * 0.38 }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      {online !== undefined ? (
        <View
          style={[
            styles.presenceDot,
            {
              backgroundColor: online ? COLORS.success : COLORS.textSubtle,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  initialsContainer: {
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  initials: {
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#334155',
  },
  presenceDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
