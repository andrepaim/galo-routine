import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChildColors, ChildSizes } from '../../../constants/childTheme';
import { useAuthStore, usePeriodStore, useTaskStore } from '../../../lib/stores';
import { useCurrentPeriod } from '../../../lib/hooks/useCurrentPeriod';
import { useStarBudget } from '../../../lib/hooks/useStarBudget';
import { StarBudgetRing } from '../../../components/stars/StarBudgetRing';
import { PeriodSummary } from '../../../components/periods/PeriodSummary';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { CelebrationOverlay } from '../../../components/ui/CelebrationOverlay';
import { buildPeriod } from '../../../lib/utils/periodUtils';
import { createPeriod } from '../../../lib/firebase/firestore';

export default function PeriodScreen() {
  const router = useRouter();
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const tasks = useTaskStore((s) => s.tasks);
  const { activePeriod, isLoading } = useCurrentPeriod();
  const starProgress = useStarBudget();
  const completePeriod = usePeriodStore((s) => s.completePeriod);
  const [showCelebration, setShowCelebration] = useState(false);

  if (isLoading) {
    return <LoadingScreen message="Carregando período..." />;
  }

  const handleEndPeriod = () => {
    if (!familyId || !activePeriod?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Encerrar Período',
      'Tem certeza que quer encerrar o período atual? O resultado será calculado com base nas estrelas ganhas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          onPress: async () => {
            await completePeriod(familyId, activePeriod.id!);
            if (starProgress && starProgress.isRewardZone) {
              setShowCelebration(true);
            }
          },
        },
      ],
    );
  };

  const handleNewPeriod = async () => {
    if (!familyId || !family?.settings) return;
    const period = buildPeriod(family.settings, tasks);
    await createPeriod(familyId, period);
  };

  if (!activePeriod) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EmptyState
          icon="calendar-plus"
          title="Sem Período Ativo"
          description="Inicie um novo período para começar a acompanhar as estrelas."
          actionLabel="Iniciar Período"
          onAction={handleNewPeriod}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {starProgress && (
          <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.ringContainer}>
            <StarBudgetRing
              progress={starProgress}
              size={220}
              rewardPercent={activePeriod.thresholds.rewardPercent}
              penaltyPercent={activePeriod.thresholds.penaltyPercent}
            />
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(250).duration(400)}>
          <PeriodSummary period={activePeriod} />
        </Animated.View>

        <Divider style={styles.divider} />

        <Animated.View entering={FadeInUp.delay(350).duration(400)} style={styles.thresholds}>
          <Text variant="titleSmall" style={styles.thresholdTitle}>
            Metas
          </Text>
          <Text variant="bodyMedium" style={styles.thresholdItem}>
            🏆 Prêmio ({activePeriod.thresholds.rewardPercent}%): {activePeriod.thresholds.rewardDescription}
          </Text>
          <Text variant="bodyMedium" style={styles.thresholdItem}>
            ⚠️ Penalidade ({activePeriod.thresholds.penaltyPercent}%): {activePeriod.thresholds.penaltyDescription}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(450).duration(400)} style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.push('/(parent)/periods/history')}
            icon="history"
            textColor={ChildColors.starGold}
            style={styles.outlinedButton}
          >
            Ver Histórico
          </Button>
          <Button
            mode="contained"
            buttonColor={ChildColors.accentRed}
            onPress={handleEndPeriod}
            icon="stop"
          >
            Encerrar
          </Button>
        </Animated.View>
      </ScrollView>

      <CelebrationOverlay
        visible={showCelebration}
        onDismiss={() => setShowCelebration(false)}
        message="Período concluído!"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  content: {
    padding: 16,
  },
  ringContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    marginVertical: 24,
    backgroundColor: ChildColors.cardBorder,
  },
  thresholds: {
    gap: 12,
  },
  thresholdTitle: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  thresholdItem: {
    color: ChildColors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  outlinedButton: {
    borderColor: ChildColors.starGold,
  },
});
