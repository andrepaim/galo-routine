import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { FAB, Text, TextInput, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
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
  const [targetGoals, setTargetGoals] = useState('100');
  const [rewardDescription, setRewardDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const lifetimeGoals = family?.lifetimeGoalsEarned ?? 0;
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const handleCreate = async () => {
    if (!familyId || !name.trim()) return;
    setSaving(true);
    try {
      await addGoal(familyId, {
        name: name.trim(),
        description: description.trim(),
        targetGoals: parseInt(targetGoals, 10) || 100,
        rewardDescription: rewardDescription.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false);
      setName('');
      setDescription('');
      setTargetGoals('100');
      setRewardDescription('');
    } catch (e) {
      console.error('Failed to create goal:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (goalId: string, goalName: string) => {
    Alert.alert('Excluir Meta', `Excluir "${goalName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
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
                TOTAL DE GOLS MARCADOS
              </Text>
              <Text variant="headlineLarge" style={styles.lifetimeCount}>
                {lifetimeGoals}
              </Text>
            </Animated.View>

            {showForm && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <Card style={styles.formCard}>
                  <Card.Content style={styles.formContent}>
                    <Text variant="titleMedium" style={styles.formTitle}>
                      Nova Meta de Longo Prazo
                    </Text>
                    <TextInput
                      label="Nome da Meta"
                      value={name}
                      onChangeText={setName}
                      mode="outlined"
                      style={styles.input}
                      textColor={ChildColors.textPrimary}
                      outlineColor={ChildColors.cardBorder}
                      activeOutlineColor={ChildColors.starGold}
                    />
                    <TextInput
                      label="Descrição (opcional)"
                      value={description}
                      onChangeText={setDescription}
                      mode="outlined"
                      multiline
                      style={styles.input}
                      textColor={ChildColors.textPrimary}
                      outlineColor={ChildColors.cardBorder}
                      activeOutlineColor={ChildColors.starGold}
                    />
                    <TextInput
                      label="Gols Necessários"
                      value={targetGoals}
                      onChangeText={(t) => setTargetGoals(t.replace(/[^0-9]/g, ''))}
                      mode="outlined"
                      keyboardType="number-pad"
                      style={styles.input}
                      textColor={ChildColors.textPrimary}
                      outlineColor={ChildColors.cardBorder}
                      activeOutlineColor={ChildColors.starGold}
                    />
                    <TextInput
                      label="Recompensa"
                      value={rewardDescription}
                      onChangeText={setRewardDescription}
                      mode="outlined"
                      placeholder="ex: Ir ao jogo do Galo"
                      style={styles.input}
                      textColor={ChildColors.textPrimary}
                      outlineColor={ChildColors.cardBorder}
                      activeOutlineColor={ChildColors.starGold}
                    />
                    <View style={styles.formActions}>
                      <Button 
                        mode="outlined" 
                        onPress={() => setShowForm(false)}
                        textColor={ChildColors.textSecondary}
                        style={styles.cancelButton}
                      >
                        Cancelar
                      </Button>
                      <Button
                        mode="contained"
                        onPress={handleCreate}
                        loading={saving}
                        disabled={!name.trim() || saving}
                        buttonColor={ChildColors.starGold}
                        textColor={ChildColors.galoBlack}
                      >
                        Criar Meta
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
              lifetimeGoals={lifetimeGoals}
              onDelete={() => handleDelete(item.id!, item.name)}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="flag-checkered"
            title="Nenhuma Meta"
            description="Crie metas de longo prazo para motivar seu filho!"
          />
        }
        contentContainerStyle={styles.list}
      />

      {!showForm && (
        <FAB
          icon="plus"
          onPress={() => setShowForm(true)}
          style={styles.fab}
          color={ChildColors.galoBlack}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  list: {
    padding: 16,
  },
  lifetimeCard: {
    alignItems: 'center',
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
  },
  lifetimeLabel: {
    color: ChildColors.textSecondary,
    letterSpacing: 1,
  },
  lifetimeCount: {
    fontWeight: 'bold',
    color: ChildColors.starGold,
  },
  formCard: {
    backgroundColor: ChildColors.cardBackground,
    marginBottom: 24,
    borderRadius: ChildSizes.cardRadius,
  },
  formContent: {
    gap: 12,
  },
  formTitle: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  input: {
    backgroundColor: ChildColors.cardBackground,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
  },
  cancelButton: {
    borderColor: ChildColors.cardBorder,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: ChildColors.starGold,
  },
});
