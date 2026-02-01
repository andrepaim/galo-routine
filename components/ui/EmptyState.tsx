import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon, Button } from 'react-native-paper';
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
      <Icon source={icon} size={64} color={Colors.textLight} />
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
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
