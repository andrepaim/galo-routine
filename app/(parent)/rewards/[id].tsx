import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChildColors, ChildSizes } from '../../../constants/childTheme';
import { useAuthStore, useRewardStore } from '../../../lib/stores';
import { RewardForm } from '../../../components/rewards/RewardForm';
import type { RewardFormData } from '../../../lib/types';

export default function EditRewardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const familyId = useAuthStore((s) => s.familyId);
  const { rewards, editReward, removeReward } = useRewardStore();
  const [loading, setLoading] = useState(false);

  const reward = rewards.find((r) => r.id === id);
  if (!reward) {
    router.back();
    return null;
  }

  const handleSubmit = async (data: RewardFormData) => {
    if (!familyId || !id) return;
    setLoading(true);
    try {
      await editReward(familyId, id, data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.error('Failed to update reward:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Reward', `Delete "${reward.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!familyId || !id) return;
          await removeReward(familyId, id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <RewardForm
        initialData={{
          name: reward.name,
          description: reward.description,
          goalCost: reward.goalCost,
          icon: reward.icon,
          availability: reward.availability,
          quantity: reward.quantity,
          requiresApproval: reward.requiresApproval,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={loading}
        submitLabel="Save Changes"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
});
