import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { FAB, Text, TextInput, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Layout } from '../../constants';
import { useAuthStore, useGoalStore } from '../../lib/stores';
import { GoalCard } from '../../components/goals/GoalCard';
import { EmptyState } from '../../components/ui/EmptyState';
import type { GoalFormData } from '../../lib/types';

export default function GoalsScreen() {
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const { goals, addGoal, removeGoal } = useGoalStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetStars, setTargetStars] = useState('100');
  const [rewardDescription, setRewardDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const lifetimeStars = family?.lifetimeStarsEarned ?? 0;
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const handleCreate = async () => {
    if (!familyId || !name.trim()) return;
    setSaving(true);
    try {
      await addGoal(familyId, {
        name: name.trim(),
        description: description.trim(),
        targetStars: parseInt(targetStars, 10) || 100,
        rewardDescription: rewardDescription.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false);
      setName('');
      setDescription('');
      setTargetStars('100');
      setRewardDescription('');
    } catch (e) {
      console.error('Failed to create goal:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (goalId: string, goalName: string) => {
    Alert.alert('Delete Goal', `Delete "${goalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => familyId && removeGoal(familyId, goalId),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={[...activeGoals, ...completedGoals]}
        keyExtractor={(item) => item.id!}
        ListHeaderComponent={
          <View>
            <Animated.View entering={FadeInUp.duration(400)} style={styles.lifetimeCard}>
              <Text variant="bodySmall" style={styles.lifetimeLabel}>
                LIFETIME STARS EARNED
              </Text>
              <Text variant="headlineLarge" style={styles.lifetimeCount}>
                {lifetimeStars}
              </Text>
            </Animated.View>

            {showForm && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <Card style={styles.formCard}>
                  <Card.Content style={styles.formContent}>
                    <Text variant="titleMedium" style={styles.formTitle}>
                      New Long-Term Goal
                    </Text>
                    <TextInput
                      label="Goal Name"
                      value={name}
                      onChangeText={setName}
                      mode="outlined"
                      style={styles.input}
                    />
                    <TextInput
                      label="Description (optional)"
                      value={description}
                      onChangeText={setDescription}
                      mode="outlined"
                      multiline
                      style={styles.input}
                    />
                    <TextInput
                      label="Target Stars"
                      value={targetStars}
                      onChangeText={(t) => setTargetStars(t.replace(/[^0-9]/g, ''))}
                      mode="outlined"
                      keyboardType="number-pad"
                      style={styles.input}
                    />
                    <TextInput
                      label="Reward Description"
                      value={rewardDescription}
                      onChangeText={setRewardDescription}
                      mode="outlined"
                      placeholder="e.g., Trip to the soccer final"
                      style={styles.input}
                    />
                    <View style={styles.formActions}>
                      <Button mode="outlined" onPress={() => setShowForm(false)}>
                        Cancel
                      </Button>
                      <Button
                        mode="contained"
                        onPress={handleCreate}
                        loading={saving}
                        disabled={!name.trim() || saving}
                      >
                        Create Goal
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              </Animated.View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 80).duration(300)}>
            <GoalCard
              goal={item}
              lifetimeStars={lifetimeStars}
              onDelete={() => handleDelete(item.id!, item.name)}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="flag-checkered"
            title="No Goals Yet"
            description="Create long-term goals to motivate your child!"
          />
        }
        contentContainerStyle={styles.list}
      />

      {!showForm && (
        <FAB
          icon="plus"
          onPress={() => setShowForm(true)}
          style={styles.fab}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Layout.padding.md,
  },
  lifetimeCard: {
    alignItems: 'center',
    backgroundColor: Colors.primaryContainer,
    borderRadius: Layout.radius.lg,
    padding: Layout.padding.lg,
    marginBottom: Layout.padding.lg,
  },
  lifetimeLabel: {
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  lifetimeCount: {
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  formCard: {
    backgroundColor: Colors.surface,
    marginBottom: Layout.padding.lg,
  },
  formContent: {
    gap: Layout.padding.sm,
  },
  formTitle: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Layout.padding.md,
    marginTop: Layout.padding.sm,
  },
  fab: {
    position: 'absolute',
    right: Layout.padding.md,
    bottom: Layout.padding.md,
    backgroundColor: Colors.primary,
  },
});
