import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import { Colors } from '../../constants';

interface StarDisplayProps {
  count: number;
  maxStars?: number;
  size?: number;
  showEmpty?: boolean;
}

export function StarDisplay({ count, maxStars = 5, size = 20, showEmpty = true }: StarDisplayProps) {
  const stars = [];
  for (let i = 0; i < (showEmpty ? maxStars : count); i++) {
    stars.push(
      <Icon
        key={i}
        source={i < count ? 'star' : 'star-outline'}
        size={size}
        color={i < count ? Colors.starFilled : Colors.starEmpty}
      />,
    );
  }

  return <View style={styles.container}>{stars}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
