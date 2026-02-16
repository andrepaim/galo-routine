import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
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
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { ChildColors, ChildSizes, GALO_EMOJI, STAR_EMOJI, Layout } from '../../constants';

const { width } = Dimensions.get('window');

// Galo Volpi mascot image (white version for dark background)
const GaloVolpiImage = require('../../assets/images/mascot/galo-volpi-white.png');
import { useAuthStore, useCompletionStore } from '../../lib/stores';
import { useTodayTasks } from '../../lib/hooks/useTodayTasks';
import { useStarBudget } from '../../lib/hooks/useStarBudget';
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
  const starProgress = useStarBudget();
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

  // Animation values
  const celebrationScale = useSharedValue(0);
  const ballFly = useSharedValue(0);
  const netShake = useSharedValue(0);
  const [showVictory, setShowVictory] = useState(false);

  const handleComplete = async (task: typeof todayTasks[0]) => {
    if (!familyId || !activePeriod?.id) return;
    
    // Goal animation sequence!
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // 1. Ball flies to goal
    ballFly.value = withSequence(
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 0 })
    );
    
    // 2. Net shakes
    setTimeout(() => {
      netShake.value = withSequence(
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    }, 500);
    
    await markTaskDone(familyId, activePeriod.id, task);
    
    // Check for victory
    const newCompletedCount = todayTasks.filter(t => 
      t.completion?.status === 'approved' || t.completion?.status === 'pending'
    ).length + 1;
    
    if (newCompletedCount === todayTasks.length && todayTasks.length > 0) {
      // Victory celebration!
      setTimeout(() => {
        setShowVictory(true);
        celebrationScale.value = withSpring(1, { damping: 8, stiffness: 100 });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 800);
    }
  };

  // Skip loading screen in dev mode
  if (isLoading && !isDevMode) {
    return <LoadingScreen variant="skeleton-list" />;
  }

  const completedCount = todayTasks.filter(t => 
    t.completion?.status === 'approved' || t.completion?.status === 'pending'
  ).length;
  const progress = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;

  // Calculate goals from completed tasks (using starValue which maps to goals)
  const completedGoals = todayTasks
    .filter(t => t.completion?.status === 'approved' || t.completion?.status === 'pending')
    .reduce((sum, t) => sum + (t.starValue || 1), 0);
  const totalGoals = todayTasks.reduce((sum, t) => sum + (t.starValue || 1), 0);

  // Show rival reveal on first load (2 seconds)
  const [showRival, setShowRival] = useState(true);
  React.useEffect(() => {
    const timer = setTimeout(() => setShowRival(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const ballAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { 
        translateY: interpolate(ballFly.value, [0, 1], [0, -200]) 
      },
      { 
        translateX: interpolate(ballFly.value, [0, 1], [0, 100]) 
      },
      { 
        scale: interpolate(ballFly.value, [0, 0.5, 1], [1, 0.7, 0.3]) 
      },
    ],
    opacity: interpolate(ballFly.value, [0, 0.8, 1], [0, 1, 0]),
  }));

  const netAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: netShake.value }],
  }));

  const celebrationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
    opacity: celebrationScale.value,
  }));

  return (
    <View style={styles.container}>
      {/* Rival Reveal (inline, 2s) */}
      {showRival && (
        <Animated.View 
          entering={FadeInDown.duration(300)} 
          exiting={FadeInUp.duration(300)}
          style={styles.rivalReveal}
        >
          <Text style={styles.rivalText}>
            🔥 HOJE VOCÊ ENFRENTA: {displayOpponentName.toUpperCase()} 🔥
          </Text>
        </Animated.View>
      )}

      {/* Inline Live Score */}
      <Animated.View entering={FadeInDown.delay(showRival ? 2000 : 0).duration(500)}>
        <Surface style={styles.liveScoreCard} elevation={0}>
          {displayIsLive && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>AO VIVO</Text>
            </View>
          )}
          
          <View style={styles.scoreRow}>
            <View style={styles.teamSection}>
              <Text style={styles.teamName} numberOfLines={1}>
                {childName || 'Vitor'}
              </Text>
            </View>
            
            <View style={styles.scoreSection}>
              <Text style={styles.score}>{completedGoals}</Text>
              <Animated.View style={netAnimatedStyle}>
                <Text style={styles.ballEmoji}>🥅</Text>
              </Animated.View>
              <Text style={styles.score}>{displayOpponentGoals}</Text>
            </View>
            
            <View style={styles.teamSection}>
              <Text style={[styles.teamName, styles.opponentName]} numberOfLines={1}>
                {displayOpponentName}
              </Text>
            </View>
          </View>
        </Surface>
      </Animated.View>
      
      <FlatList
        data={todayTasks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Progress Bar with Soccer Balls */}
            <Animated.View entering={FadeInUp.delay(200).duration(500)}>
              <Surface style={styles.progressCard} elevation={0}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Progresso de Hoje</Text>
                  <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                </View>
                
                <View style={styles.ballProgress}>
                  {Array.from({ length: totalGoals }, (_, i) => (
                    <Text key={i} style={styles.progressBall}>
                      {i < completedGoals ? '⚽' : '⚪'}
                    </Text>
                  ))}
                </View>
                
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progress}%` }
                    ]} 
                  />
                </View>
              </Surface>
            </Animated.View>

            {/* Tasks Header */}
            <Animated.View entering={FadeInLeft.delay(400).duration(400)} style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                ⚽ SUAS JOGADAS
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
      
      {/* Flying Ball Animation */}
      <Animated.View style={[styles.flyingBall, ballAnimatedStyle]} pointerEvents="none">
        <Text style={styles.flyingBallEmoji}>⚽</Text>
      </Animated.View>
      
      {/* Victory Celebration */}
      {showVictory && (
        <Animated.View style={[styles.victoryOverlay, celebrationAnimatedStyle]} pointerEvents="none">
          <Text style={styles.victoryGalo}>🐓</Text>
          <Text style={styles.victoryText}>VITÓRIA! 🏆</Text>
          <Text style={styles.victorySubtext}>Todas as tarefas completadas!</Text>
          <View style={styles.fireworks}>
            <Text style={styles.firework}>🎆</Text>
            <Text style={styles.firework}>✨</Text>
            <Text style={styles.firework}>🎆</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  
  // Rival Reveal
  rivalReveal: {
    backgroundColor: ChildColors.accentRed,
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rivalText: {
    fontSize: 16,
    fontWeight: '800',
    color: ChildColors.textPrimary,
    textAlign: 'center',
  },
  
  // Inline Live Score
  liveScoreCard: {
    backgroundColor: ChildColors.cardBackground,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSection: {
    flex: 1,
  },
  teamName: {
    color: ChildColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  opponentName: {
    textAlign: 'right',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  score: {
    color: ChildColors.starGold,
    fontSize: 32,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'center',
  },
  ballEmoji: {
    fontSize: 24,
    marginHorizontal: 8,
  },
  
  // Content
  header: {
    paddingBottom: ChildSizes.sectionGap,
  },
  
  // Progress Card
  progressCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 20,
    marginBottom: ChildSizes.itemGap,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '800',
    color: ChildColors.starGold,
  },
  ballProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  progressBall: {
    fontSize: 20,
  },
  progressBar: {
    height: 12,
    backgroundColor: ChildColors.galoBlack,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ChildColors.starGold,
    borderRadius: 6,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  
  // Animations
  flyingBall: {
    position: 'absolute',
    top: '50%',
    left: '20%',
    zIndex: 1000,
  },
  flyingBallEmoji: {
    fontSize: 32,
  },
  
  // Victory Overlay
  victoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  victoryGalo: {
    fontSize: 100,
    marginBottom: 20,
  },
  victoryText: {
    fontSize: 48,
    fontWeight: '800',
    color: ChildColors.starGold,
    marginBottom: 16,
    textAlign: 'center',
  },
  victorySubtext: {
    fontSize: 20,
    color: ChildColors.textPrimary,
    marginBottom: 32,
    textAlign: 'center',
  },
  fireworks: {
    flexDirection: 'row',
    gap: 40,
  },
  firework: {
    fontSize: 48,
  },
});
