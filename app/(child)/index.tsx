import React from 'react';
import { View, FlatList, StyleSheet, Image } from 'react-native';
import { Text, Icon, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInLeft, 
  FadeInUp, 
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { ChildColors, ChildSizes, GALO_EMOJI, STAR_EMOJI, Layout } from '../../constants';

// Galo Volpi mascot image (white version for dark background)
const GaloVolpiImage = require('../../assets/images/mascot/galo-volpi-white.png');
import { useAuthStore, useCompletionStore } from '../../lib/stores';
import { useTodayTasks } from '../../lib/hooks/useTodayTasks';
import { useGoalBudget } from '../../lib/hooks/useGoalBudget';
import { useCurrentPeriod } from '../../lib/hooks/useCurrentPeriod';
import { useChampionship, useMatch } from '../../lib/hooks';
import { GaloTaskCard } from '../../components/tasks/GaloTaskCard';
import { GaloStarCounter } from '../../components/stars/GaloStarCounter';
import { GaloGoalCounter, LiveScoreboard } from '../../components/championship';
import { StreakDisplay } from '../../components/streaks/StreakDisplay';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export default function ChildTodayScreen() {
  const childName = useAuthStore((s) => s.childName);
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const { activePeriod } = useCurrentPeriod();
  const goalProgress = useGoalBudget();
  const { todayTasks, isLoading } = useTodayTasks();
  const markTaskDone = useCompletionStore((s) => s.markTaskDone);
  
  // Championship hooks
  const { 
    championship, 
    isLoading: isChampionshipLoading,
    initializeIfNeeded 
  } = useChampionship();
  
  const { 
    match, 
    opponentName, 
    opponentGoals,
    isOpen: isMatchOpen,
  } = useMatch();

  const today = new Date();
  
  // Dev mode detection for mock data
  const isDevMode = typeof window !== 'undefined' && window.location.search.includes('dev=');
  
  // Mock opponent for dev mode when no real data
  const displayOpponentName = opponentName !== 'Adversário' ? opponentName : (isDevMode ? 'Palmeiras' : opponentName);
  const displayOpponentGoals = match ? opponentGoals : (isDevMode ? 2 : 0);
  const displayIsLive = match ? isMatchOpen : (isDevMode ? true : false);
  
  // Initialize championship on first load if needed
  React.useEffect(() => {
    if (!isChampionshipLoading && !championship && familyId) {
      initializeIfNeeded();
    }
  }, [isChampionshipLoading, championship, familyId]);

  // Animated rooster bounce
  const roosterBounce = useSharedValue(0);
  React.useEffect(() => {
    roosterBounce.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const roosterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: roosterBounce.value }],
  }));

  const handleComplete = async (task: typeof todayTasks[0]) => {
    if (!familyId || !activePeriod?.id) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markTaskDone(familyId, activePeriod.id, task);
  };

  // Skip loading screen in dev mode
  if (isLoading && !isDevMode) {
    return <LoadingScreen variant="skeleton-list" />;
  }

  const completedCount = todayTasks.filter(t => 
    t.completion?.status === 'approved' || t.completion?.status === 'pending'
  ).length;
  const progress = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;

  // Calculate goals from completed tasks
  const completedGoals = todayTasks
    .filter(t => t.completion?.status === 'approved' || t.completion?.status === 'pending')
    .reduce((sum, t) => sum + (t.goals || 1), 0);
  const totalGoals = todayTasks.reduce((sum, t) => sum + (t.goals || 1), 0);

  return (
    <View style={styles.container}>
      {/* Live Scoreboard at top */}
      <LiveScoreboard
        userName={childName || 'Vitor'}
        userGoals={completedGoals}
        opponentName={displayOpponentName}
        opponentGoals={displayOpponentGoals}
        isLive={displayIsLive}
      />
      
      <FlatList
        data={todayTasks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Greeting with Animated Rooster */}
            <Animated.View entering={FadeInLeft.duration(500)} style={styles.greetingRow}>
              <Animated.View style={[styles.mascotContainer, roosterStyle]}>
                <Image 
                  source={GaloVolpiImage} 
                  style={styles.mascotImage}
                  resizeMode="contain"
                />
                {/* Speech bubble */}
                <View style={styles.speechBubble}>
                  <Text style={styles.speechText}>Bora!</Text>
                </View>
              </Animated.View>
              <View style={styles.greetingText}>
                <Text style={styles.greeting}>
                  E aí, {childName || 'Campeão'}!
                </Text>
                <Text style={styles.date}>
                  {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </Text>
              </View>
            </Animated.View>

            {/* Goal Summary Card (Championship Mode) */}
            <Animated.View entering={FadeInUp.delay(200).duration(500)}>
              <Surface style={styles.starCard} elevation={0}>
                <GaloGoalCounter
                  scored={completedGoals}
                  possible={totalGoals}
                  pending={goalProgress?.pending || 0}
                  opponentName={displayOpponentName}
                  opponentGoals={displayOpponentGoals}
                />
              </Surface>
            </Animated.View>

            {/* Stats Row */}
            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.statsRow}>
              {/* Goals */}
              <Surface style={styles.statCard} elevation={0}>
                <Text style={styles.statEmoji}>⚽</Text>
                <Text style={styles.statNumber}>{completedGoals}</Text>
                <Text style={styles.statLabel}>Gols Hoje</Text>
              </Surface>
              
              {/* Streak */}
              <Surface style={styles.statCard} elevation={0}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statNumber}>{family?.currentStreak ?? 0}</Text>
                <Text style={styles.statLabel}>Dias seguidos</Text>
              </Surface>

              {/* Progress */}
              <Surface style={styles.statCard} elevation={0}>
                <Text style={styles.statEmoji}>📊</Text>
                <Text style={styles.statNumber}>{Math.round(progress)}%</Text>
                <Text style={styles.statLabel}>Completo</Text>
              </Surface>
            </Animated.View>

            {/* Tasks Header */}
            <Animated.View entering={FadeInLeft.delay(400).duration(400)} style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Tarefas de Hoje
              </Text>
              <View style={styles.taskCount}>
                <Text style={styles.taskCountText}>
                  {completedCount}/{todayTasks.length}
                </Text>
              </View>
            </Animated.View>
          </View>
        }
        renderItem={({ item, index }) => (
          <GaloTaskCard
            task={item}
            onComplete={() => handleComplete(item)}
            index={index}
          />
        )}
        ListEmptyComponent={
          <Animated.View entering={ZoomIn.delay(500).duration(500)}>
            <Surface style={styles.emptyCard} elevation={0}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>Dia Livre!</Text>
              <Text style={styles.emptySubtitle}>
                Nenhuma tarefa para hoje. Aproveite!
              </Text>
            </Surface>
          </Animated.View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  header: {
    paddingBottom: ChildSizes.sectionGap,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: ChildSizes.sectionGap,
  },
  mascotContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  mascotImage: {
    width: 60,
    height: 100,
  },
  speechBubble: {
    position: 'absolute',
    top: -8,
    right: -20,
    backgroundColor: ChildColors.starGold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    transform: [{ rotate: '8deg' }],
  },
  speechText: {
    fontSize: 12,
    fontWeight: '800',
    color: ChildColors.galoBlack,
  },
  greetingText: {
    flex: 1,
  },
  greeting: {
    fontSize: ChildSizes.titleSize,
    fontWeight: '800',
    color: ChildColors.textPrimary,
  },
  date: {
    fontSize: ChildSizes.bodySize,
    color: ChildColors.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  starCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: ChildSizes.cardPadding,
    marginBottom: ChildSizes.itemGap,
    borderWidth: 1,
    borderColor: ChildColors.starGold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: ChildSizes.sectionGap,
  },
  statCard: {
    flex: 1,
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: ChildColors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: ChildColors.textSecondary,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ChildColors.textPrimary,
  },
  taskCount: {
    backgroundColor: ChildColors.starGold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  taskCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: ChildColors.galoBlack,
  },
  list: {
    padding: 16,
  },
  emptyCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: ChildColors.starGold,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: ChildColors.textSecondary,
    textAlign: 'center',
  },
});
