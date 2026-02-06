import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, Button, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInLeft, FadeInUp } from 'react-native-reanimated';
import { Layout } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { useAuthStore, usePeriodStore, useCompletionStore, useRewardStore } from '../../lib/stores';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
import { StarCounter } from '../../components/stars/StarCounter';
import { PeriodSummary } from '../../components/periods/PeriodSummary';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { AnimatedPressable } from '../../components/ui/AnimatedPressable';

// Galo mascot
const GaloVolpi = require('../../assets/images/mascot/galo-volpi-white.png');

export default function ParentHomeScreen() {
  const router = useRouter();
  const parentName = useAuthStore((s) => s.parentName);
  const childName = useAuthStore((s) => s.childName);
  const family = useAuthStore((s) => s.family);
  const { activePeriod, isLoading: periodLoading } = useCurrentPeriod();
  const starProgress = useStarBudget();
  const pendingCount = useCompletionStore((s) => s.getPendingCompletions().length);
  const pendingRedemptions = useRewardStore((s) => s.redemptions.filter((r) => r.status === 'pending').length);

  if (periodLoading) {
    return <LoadingScreen variant="skeleton-dashboard" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with mascot */}
        <Animated.View entering={FadeInLeft.duration(400)} style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={styles.greeting}>
              Olá, {parentName || 'Pai/Mãe'}!
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Gerenciando a rotina de {childName || 'seu filho'}
            </Text>
          </View>
          <Image source={GaloVolpi} style={styles.headerMascot} resizeMode="contain" />
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.statsRow}>
          <AnimatedPressable
            onPress={() => router.push('/(parent)/approvals')}
            haptic="light"
            style={styles.statCardWrapper}
          >
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Icon source="clock-outline" size={32} color={ChildColors.starGold} />
                <Text variant="headlineMedium" style={styles.statNumber}>
                  {pendingCount}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Pendentes
                </Text>
              </Card.Content>
            </Card>
          </AnimatedPressable>

          <Card style={[styles.statCard, styles.statCardWrapper]}>
            <Card.Content style={styles.statContent}>
              {starProgress && (
                <StarCounter
                  earned={starProgress.earned}
                  budget={starProgress.budget}
                  pending={starProgress.pending}
                />
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Star Balance & Streak */}
        <Animated.View entering={FadeInUp.delay(150).duration(400)} style={styles.statsRow}>
          <Card style={[styles.statCard, styles.statCardWrapper]}>
            <Card.Content style={styles.statContent}>
              <Icon source="star" size={28} color={ChildColors.starGold} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {family?.starBalance ?? 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Saldo de Estrelas
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, styles.statCardWrapper]}>
            <Card.Content style={styles.statContent}>
              <Icon source="fire" size={28} color={(family?.currentStreak ?? 0) > 0 ? ChildColors.accentRed : ChildColors.textMuted} />
              <Text variant="headlineSmall" style={styles.statNumber}>
                {family?.currentStreak ?? 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Dias Seguidos
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Active Period */}
        {activePeriod && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Período Atual
            </Text>
            <PeriodSummary period={activePeriod} />
          </Animated.View>
        )}

        {/* Pending Redemptions */}
        {pendingRedemptions > 0 && (
          <Animated.View entering={FadeInUp.delay(250).duration(400)}>
            <AnimatedPressable
              onPress={() => router.push('/(parent)/rewards/history')}
              haptic="light"
            >
              <Card style={styles.pendingRedemptionCard}>
                <Card.Content style={styles.pendingRedemptionContent}>
                  <Icon source="gift-outline" size={24} color={ChildColors.starGold} />
                  <Text variant="bodyMedium" style={styles.pendingRedemptionText}>
                    {pendingRedemptions} {pendingRedemptions === 1 ? 'resgate pendente' : 'resgates pendentes'}
                  </Text>
                  <Icon source="chevron-right" size={20} color={ChildColors.textSecondary} />
                </Card.Content>
              </Card>
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Ações Rápidas
          </Text>
          <View style={styles.actionsRow}>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => router.push('/(parent)/tasks/new')}
              style={styles.actionButton}
              buttonColor={ChildColors.starGold}
              textColor={ChildColors.galoBlack}
            >
              Nova Tarefa
            </Button>
            <Button
              mode="outlined"
              icon="check-decagram"
              onPress={() => router.push('/(parent)/approvals')}
              style={[styles.actionButton, styles.outlinedButton]}
              textColor={ChildColors.starGold}
            >
              Revisar ({pendingCount})
            </Button>
          </View>
          <View style={styles.actionsRow}>
            <Button
              mode="outlined"
              icon="gift"
              onPress={() => router.push('/(parent)/rewards')}
              style={[styles.actionButton, styles.outlinedButton]}
              textColor={ChildColors.starGold}
            >
              Prêmios
            </Button>
            <Button
              mode="outlined"
              icon="chart-line"
              onPress={() => router.push('/(parent)/analytics')}
              style={[styles.actionButton, styles.outlinedButton]}
              textColor={ChildColors.starGold}
            >
              Relatórios
            </Button>
          </View>
        </Animated.View>
      </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  headerMascot: {
    width: 50,
    height: 80,
  },
  greeting: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  subtitle: {
    color: ChildColors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    backgroundColor: ChildColors.cardBackground,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
    borderRadius: ChildSizes.cardRadius,
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  statLabel: {
    color: ChildColors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginBottom: 12,
  },
  pendingRedemptionCard: {
    backgroundColor: ChildColors.cardBackground,
    borderWidth: 1,
    borderColor: ChildColors.starGold,
    borderRadius: ChildSizes.cardRadius,
    marginBottom: 16,
  },
  pendingRedemptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingRedemptionText: {
    flex: 1,
    color: ChildColors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  outlinedButton: {
    borderColor: ChildColors.starGold,
  },
});
