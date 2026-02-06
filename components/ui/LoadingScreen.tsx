import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Colors } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { SkeletonList, SkeletonDashboard } from './SkeletonLoader';

type LoadingVariant = 'spinner' | 'skeleton-list' | 'skeleton-dashboard';

interface LoadingScreenProps {
  message?: string;
  variant?: LoadingVariant;
}

export function LoadingScreen({ message = 'Loading...', variant = 'spinner' }: LoadingScreenProps) {
  if (variant === 'skeleton-list') {
    return (
      <View style={styles.skeletonContainer}>
        <SkeletonList />
      </View>
    );
  }

  if (variant === 'skeleton-dashboard') {
    return (
      <View style={styles.skeletonContainer}>
        <SkeletonDashboard />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={ChildColors.starGold} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ChildColors.galoBlack,
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  text: {
    marginTop: 16,
    color: ChildColors.textSecondary,
  },
});
