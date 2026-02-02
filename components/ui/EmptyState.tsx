import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, Button } from 'react-native-paper';
import Animated, { BounceIn, FadeInUp } from 'react-native-reanimated';
import { Colors, Layout } from '../../constants';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Animated.View entering={BounceIn.delay(100)} style={styles.iconBackdrop}>
        <Icon source={icon} size={72} color={Colors.textLight} />
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(300)}>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInUp.delay(450)}>
        <Text variant="bodyMedium" style={styles.description}>
          {description}
        </Text>
      </Animated.View>
      {actionLabel && onAction && (
        <Animated.View entering={FadeInUp.delay(600)}>
          <Button mode="contained" onPress={onAction} style={styles.button}>
            {actionLabel}
          </Button>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.padding.xl,
  },
  iconBackdrop: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginTop: Layout.padding.md,
    color: Colors.text,
    textAlign: 'center',
  },
  description: {
    marginTop: Layout.padding.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: Layout.padding.lg,
  },
});
