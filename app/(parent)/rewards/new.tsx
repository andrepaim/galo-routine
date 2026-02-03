import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../../constants';
import { useAuthStore, useRewardStore } from '../../../lib/stores';
import { RewardForm } from '../../../components/rewards/RewardForm';
import type { RewardFormData } from '../../../lib/types';

export default function NewRewardScreen() {
  const router = useRouter();
  const familyId = useAuthStore((s) => s.familyId);
  const addReward = useRewardStore((s) => s.addReward);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: RewardFormData) => {
    if (!familyId) return;
    setLoading(true);
    try {
      await addReward(familyId, data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.error('Failed to create reward:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <RewardForm onSubmit={handleSubmit} onCancel={() => router.back()} isLoading={loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
