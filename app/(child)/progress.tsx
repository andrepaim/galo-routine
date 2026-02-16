import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, BounceInLeft, BounceInRight, SlideInUp } from 'react-native-reanimated';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChildColors, ChildSizes } from '../../constants';
import { useChampionship } from '../../lib/hooks';
import { useAuthStore, useRewardStore } from '../../lib/stores';
import { Standing } from '../../lib/types/championship';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { RewardCard } from '../../components/rewards/RewardCard';

const { width } = Dimensions.get('window');

// Mock data for development — Série D teams (small clubs, not Série A giants)
const mockStandings: Standing[] = [
  { teamId: 'vitor', teamName: 'Vitor', isUser: true, played: 5, won: 4, drawn: 1, lost: 0, goalsFor: 18, goalsAgainst: 6, goalDifference: 12, points: 13, position: 1 },
  { teamId: 'tombense', teamName: 'Tombense', isUser: false, played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 12, goalsAgainst: 8, goalDifference: 4, points: 10, position: 2 },
  { teamId: 'pouso-alegre', teamName: 'Pouso Alegre', isUser: false, played: 5, won: 3, drawn: 0, lost: 2, goalsFor: 10, goalsAgainst: 9, goalDifference: 1, points: 9, position: 3 },
  { teamId: 'patrocinense', teamName: 'Patrocinense', isUser: false, played: 5, won: 2, drawn: 2, lost: 1, goalsFor: 8, goalsAgainst: 7, goalDifference: 1, points: 8, position: 4 },
  { teamId: 'uberlandia', teamName: 'Uberlândia', isUser: false, played: 5, won: 2, drawn: 1, lost: 2, goalsFor: 7, goalsAgainst: 8, goalDifference: -1, points: 7, position: 5 },
  { teamId: 'caldense', teamName: 'Caldense', isUser: false, played: 5, won: 1, drawn: 2, lost: 2, goalsFor: 6, goalsAgainst: 10, goalDifference: -4, points: 5, position: 6 },
  { teamId: 'tupi', teamName: 'Tupi', isUser: false, played: 5, won: 1, drawn: 1, lost: 3, goalsFor: 5, goalsAgainst: 11, goalDifference: -6, points: 4, position: 7 },
  { teamId: 'democrata', teamName: 'Democrata', isUser: false, played: 5, won: 0, drawn: 2, lost: 3, goalsFor: 4, goalsAgainst: 12, goalDifference: -8, points: 2, position: 8 },
];

// Generate weekly results based on current date
const generateWeeklyResults = () => {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekdays = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
  
  return weekdays.map((day, index) => {
    const date = addDays(startOfCurrentWeek, index);
    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const isFuture = date > today;
    
    if (isFuture) {
      return { day, goals: 0, result: '-', emoji: '⚽', date };
    } else if (isToday) {
      return { day, goals: 0, result: 'HOJE', emoji: '⚽', date };  
    } else {
      // Mock past results
      const mockGoals = Math.floor(Math.random() * 4) + 1;
      const mockResult = mockGoals >= 3 ? 'VITÓRIA' : mockGoals >= 2 ? 'EMPATE' : 'DERROTA';
      const mockEmoji = mockGoals >= 3 ? '🏆' : mockGoals >= 2 ? '🤝' : '😞';
      return { day, goals: mockGoals, result: mockResult, emoji: mockEmoji, date };
    }
  });
};

export default function ProgressScreen() {
  const router = useRouter();
  const [backPressed, setBackPressed] = useState(false);
  const [hojePressed, setHojePressed] = useState(false);
  const { championship, standings, isLoading } = useChampionship();
  const familyId = useAuthStore((s) => s.familyId);
  const family = useAuthStore((s) => s.family);
  const rewards = useRewardStore((s) => s.rewards);
  const redeemReward = useRewardStore((s) => s.redeemReward);
  const subscribeRewards = useRewardStore((s) => s.subscribeRewards);

  // Subscribe to rewards
  useEffect(() => {
    if (!familyId) return;
    const unsubscribe = subscribeRewards(familyId);
    return unsubscribe;
  }, [familyId, subscribeRewards]);
  
  // Loading state
  if (isLoading) {
    return <LoadingScreen message="Carregando progresso..." />;
  }

  // Generate weekly data
  const weeklyResults = generateWeeklyResults();
  
  // Use real data if available, otherwise fall back to mock
  const displayStandings = standings.length > 0 ? standings : mockStandings;
  const userId = championship?.childId || familyId || 'vitor';
  
  // Calculate current stats
  const totalStars = family?.starBalance || 0;
  
  // Calculate weekly stats
  const weeklyWins = weeklyResults.filter(d => d.result === 'VITÓRIA').length;
  const weeklyGoals = weeklyResults.reduce((sum, d) => sum + d.goals, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Back Navigation */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.headerBar}>
        <TouchableOpacity 
          style={[styles.backButton, backPressed && styles.backButtonPressed]}
          onPress={() => router.back()}
          onPressIn={() => setBackPressed(true)}
          onPressOut={() => setBackPressed(false)}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.header}>📊 SEU PROGRESSO</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
      
      {/* Simplified Weekly Summary */}
      <Animated.View entering={BounceInLeft.delay(200).duration(800)}>
        <Text style={styles.sectionTitle}>🏆 ESTA SEMANA</Text>
        
        <Surface style={styles.weeklyCard} elevation={0}>
          <View style={styles.simplifiedWeekly}>
            <View style={styles.weeklyHero}>
              <Text style={styles.weeklyHeroEmoji}>🔥</Text>
              <Text style={styles.weeklyHeroTitle}>Suas Vitórias</Text>
              <Text style={styles.weeklyHeroNumber}>{weeklyWins}</Text>
              <Text style={styles.weeklyHeroSubtitle}>dias vencidos</Text>
            </View>
            
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStatItem}>
                <Text style={styles.weeklyStatEmoji}>⚽</Text>
                <Text style={styles.weeklyStatNumber}>{weeklyGoals}</Text>
                <Text style={styles.weeklyStatLabel}>gols</Text>
              </View>
              <View style={styles.weeklyStatItem}>
                <Text style={styles.weeklyStatEmoji}>⭐</Text>
                <Text style={styles.weeklyStatNumber}>{totalStars}</Text>
                <Text style={styles.weeklyStatLabel}>estrelas</Text>
              </View>
            </View>
          </View>
        </Surface>
      </Animated.View>
      
      {/* Simplified Standings */}
      <Animated.View entering={BounceInRight.delay(400).duration(800)}>
        <Text style={styles.sectionTitle}>🏆 SUA POSIÇÃO</Text>
        
        <Surface style={styles.standingsCard} elevation={0}>
          <View style={styles.positionHero}>
            <Text style={styles.positionHeroEmoji}>
              {displayStandings.length > 0 && displayStandings.find(t => t.teamId === userId)?.position === 1 ? '🥇' :
               displayStandings.length > 0 && displayStandings.find(t => t.teamId === userId)?.position === 2 ? '🥈' :
               displayStandings.length > 0 && displayStandings.find(t => t.teamId === userId)?.position === 3 ? '🥉' : '🏃‍♂️'}
            </Text>
            <Text style={styles.positionHeroTitle}>Você está em</Text>
            <Text style={styles.positionHeroNumber}>
              {displayStandings.length > 0 ? displayStandings.find(t => t.teamId === userId)?.position || '?' : '1'}º
            </Text>
            <Text style={styles.positionHeroSubtitle}>lugar no campeonato</Text>
          </View>
          
          {/* Full standings table */}
          <View style={styles.standingsTable}>
            {/* Table header */}
            <View style={styles.standingsRow}>
              <Text style={[styles.standingsCell, styles.standingsPos]}>#</Text>
              <Text style={[styles.standingsCell, styles.standingsName]}>Time</Text>
              <Text style={[styles.standingsCell, styles.standingsStat]}>V</Text>
              <Text style={[styles.standingsCell, styles.standingsStat]}>E</Text>
              <Text style={[styles.standingsCell, styles.standingsStat]}>D</Text>
              <Text style={[styles.standingsCell, styles.standingsStat]}>SG</Text>
              <Text style={[styles.standingsCell, styles.standingsPts]}>Pts</Text>
            </View>
            
            {displayStandings.map((team, index) => {
              const isUser = team.teamId === userId;
              return (
                <View key={team.teamId} style={[styles.standingsRow, isUser && styles.standingsUserRow]}>
                  <Text style={[styles.standingsCell, styles.standingsPos]}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                  </Text>
                  <Text style={[styles.standingsCell, styles.standingsName, isUser && styles.standingsUserName]} numberOfLines={1}>
                    {team.teamName}{isUser ? ' ⭐' : ''}
                  </Text>
                  <Text style={[styles.standingsCell, styles.standingsStat, styles.standingsWin]}>{team.won}</Text>
                  <Text style={[styles.standingsCell, styles.standingsStat, styles.standingsDraw]}>{team.drawn}</Text>
                  <Text style={[styles.standingsCell, styles.standingsStat, styles.standingsLoss]}>{team.lost}</Text>
                  <Text style={[styles.standingsCell, styles.standingsStat]}>{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</Text>
                  <Text style={[styles.standingsCell, styles.standingsPts, isUser && styles.standingsUserPts]}>{team.points}</Text>
                </View>
              );
            })}
          </View>
        </Surface>
      </Animated.View>
      
      {/* Motivational Section */}
      <Animated.View entering={SlideInUp.delay(600).duration(600).springify()}>
        <Text style={styles.sectionTitle}>🎯 CONTINUE ASSIM!</Text>
        
        <Surface style={styles.motivationCard} elevation={0}>
          <View style={styles.motivationContent}>
            <Text style={styles.motivationEmoji}>🚀</Text>
            <Text style={styles.motivationTitle}>Você está indo muito bem!</Text>
            <Text style={styles.motivationMessage}>
              {totalStars >= 80 ? 'Incrível! Você é um campeão!' :
               totalStars >= 50 ? 'Muito bem! Continue assim!' :
               'Vamos conseguir mais estrelas!'}
            </Text>
            
            <View style={styles.motivationStats}>
              <View style={styles.motivationStat}>
                <Text style={styles.motivationStatEmoji}>⭐</Text>
                <Text style={styles.motivationStatText}>{totalStars} estrelas coletadas</Text>
              </View>
            </View>
          </View>
        </Surface>
      </Animated.View>
      
      {/* Rewards Section */}
      <Animated.View entering={SlideInUp.delay(700).duration(600).springify()}>
        <Text style={styles.sectionTitle}>🎁 SEUS PRÊMIOS</Text>
        
        {rewards.filter(r => r.isActive).length > 0 ? (
          <View style={styles.rewardsContainer}>
            {rewards
              .filter(r => r.isActive)
              .slice(0, 3) // Show max 3 rewards for simplicity
              .map((reward) => {
                const canAfford = totalStars >= reward.starCost;
                const isAvailable = reward.availability === 'unlimited' || (reward.quantity ?? 0) > 0;
                
                return (
                  <Surface key={reward.id} style={styles.rewardCard} elevation={0}>
                    <View style={styles.rewardContent}>
                      <View style={styles.rewardIconContainer}>
                        <Text style={styles.rewardIcon}>{reward.icon}</Text>
                      </View>
                      <View style={styles.rewardInfo}>
                        <Text style={styles.rewardName}>{reward.name}</Text>
                        <View style={styles.rewardCostRow}>
                          <Text style={styles.rewardStarIcon}>⭐</Text>
                          <Text style={styles.rewardCost}>{reward.starCost}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.redeemButton, 
                          !canAfford && styles.redeemButtonDisabled,
                          !isAvailable && styles.redeemButtonUnavailable
                        ]}
                        onPress={async () => {
                          if (canAfford && isAvailable && familyId) {
                            await redeemReward(familyId, reward);
                          }
                        }}
                        disabled={!canAfford || !isAvailable}
                      >
                        <Text style={[
                          styles.redeemButtonText,
                          !canAfford && styles.redeemButtonTextDisabled,
                          !isAvailable && styles.redeemButtonTextUnavailable
                        ]}>
                          Resgatar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Surface>
                );
              })}
          </View>
        ) : (
          <Surface style={styles.noRewardsCard} elevation={0}>
            <Text style={styles.noRewardsEmoji}>🎁</Text>
            <Text style={styles.noRewardsTitle}>Nenhum prêmio disponível</Text>
            <Text style={styles.noRewardsMessage}>
              Seus pais ainda não criaram prêmios para você!
            </Text>
          </Surface>
        )}
      </Animated.View>
      
      {/* Fun Achievement Badges */}
      <Animated.View entering={BounceInLeft.delay(800).duration(700)}>
        <Text style={styles.sectionTitle}>🏅 SUAS CONQUISTAS</Text>
        
        <View style={styles.badgeRow}>
          <Surface style={styles.badgeCard} elevation={0}>
            <Text style={styles.badgeEmoji}>
              {weeklyWins >= 5 ? '🏆' : weeklyWins >= 3 ? '🥉' : '⚽'}
            </Text>
            <Text style={styles.badgeTitle}>
              {weeklyWins >= 5 ? 'CAMPEÃO!' : weeklyWins >= 3 ? 'GUERREIRO!' : 'JOGADOR!'}
            </Text>
            <Text style={styles.badgeDesc}>
              {weeklyWins >= 5 ? 'Ganhou quase todos os dias!' : 
               weeklyWins >= 3 ? 'Várias vitórias esta semana!' : 
               'Continue jogando!'}
            </Text>
          </Surface>
        </View>
        
        <View style={styles.badgeRow}>
          <Surface style={styles.badgeCard} elevation={0}>
            <Text style={styles.badgeEmoji}>
              {totalStars >= 100 ? '⭐' : totalStars >= 50 ? '🌟' : '✨'}
            </Text>
            <Text style={styles.badgeTitle}>
              {totalStars >= 100 ? 'COLETOR DE ESTRELAS!' : 
               totalStars >= 50 ? 'COLECIONADOR!' : 
               'COLETANDO!'}
            </Text>
            <Text style={styles.badgeDesc}>
              {totalStars >= 100 ? 'Mais de 100 estrelas!' : 
               totalStars >= 50 ? 'Muitas estrelas coletadas!' : 
               `${totalStars} estrelas coletadas`}
            </Text>
          </Surface>
        </View>
      </Animated.View>
      </ScrollView>
      
      {/* Bottom Nav to HOJE */}
      <TouchableOpacity 
        style={[styles.hojeButton, hojePressed && styles.hojeButtonPressed]}
        onPress={() => router.push('/(child)')}
        onPressIn={() => setHojePressed(true)}
        onPressOut={() => setHojePressed(false)}
        activeOpacity={0.8}
      >
        <Text style={styles.hojeButtonText}>⚽ VOLTAR PARA HOJE</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  
  // Header with Back Button
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ChildColors.cardBorder,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: ChildColors.starGold,
    minWidth: 44,
    alignItems: 'center',
  },
  backButtonPressed: {
    backgroundColor: ChildColors.starGoldDark,
    transform: [{ scale: 0.95 }],
  },
  backButtonText: {
    fontSize: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ChildColors.starGold,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 60, // Same as back button to center the title
  },
  
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.starGold,
    marginBottom: 16,
    marginTop: 16,
  },
  
  // Simplified Weekly View
  weeklyCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  simplifiedWeekly: {
    alignItems: 'center',
  },
  weeklyHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  weeklyHeroEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  weeklyHeroTitle: {
    fontSize: 16,
    color: ChildColors.textSecondary,
    marginBottom: 4,
  },
  weeklyHeroNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: ChildColors.starGold,
    marginBottom: 4,
  },
  weeklyHeroSubtitle: {
    fontSize: 14,
    color: ChildColors.textSecondary,
  },
  weeklyStats: {
    flexDirection: 'row',
    gap: 30,
  },
  weeklyStatItem: {
    alignItems: 'center',
  },
  weeklyStatEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  weeklyStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: ChildColors.textPrimary,
  },
  weeklyStatLabel: {
    fontSize: 12,
    color: ChildColors.textSecondary,
  },
  
  // Simplified Standings
  standingsCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  positionHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  positionHeroEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  positionHeroTitle: {
    fontSize: 16,
    color: ChildColors.textSecondary,
    marginBottom: 4,
  },
  positionHeroNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: ChildColors.starGold,
    marginBottom: 4,
  },
  positionHeroSubtitle: {
    fontSize: 14,
    color: ChildColors.textSecondary,
  },
  standingsTable: {
    gap: 2,
  },
  standingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  standingsUserRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: ChildColors.starGold,
  },
  standingsCell: {
    fontSize: 13,
    color: ChildColors.textSecondary,
    textAlign: 'center',
  },
  standingsPos: {
    width: 30,
    fontSize: 14,
  },
  standingsName: {
    flex: 1,
    textAlign: 'left',
    fontSize: 14,
    fontWeight: '600',
    color: ChildColors.textPrimary,
  },
  standingsUserName: {
    color: ChildColors.starGold,
    fontWeight: '700',
  },
  standingsStat: {
    width: 28,
    fontSize: 13,
  },
  standingsWin: {
    color: ChildColors.accentGreen,
  },
  standingsDraw: {
    color: ChildColors.textSecondary,
  },
  standingsLoss: {
    color: ChildColors.accentRed,
  },
  standingsPts: {
    width: 32,
    fontSize: 15,
    fontWeight: '700',
    color: ChildColors.starGold,
  },
  standingsUserPts: {
    fontSize: 16,
    fontWeight: '800',
  },
  
  // Motivational Section
  motivationCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
    alignItems: 'center',
  },
  motivationContent: {
    alignItems: 'center',
  },
  motivationEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  motivationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ChildColors.starGold,
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationMessage: {
    fontSize: 16,
    color: ChildColors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  motivationStats: {
    alignItems: 'center',
  },
  motivationStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  motivationStatEmoji: {
    fontSize: 20,
  },
  motivationStatText: {
    fontSize: 14,
    color: ChildColors.textSecondary,
  },
  
  // Rewards Section
  rewardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  rewardCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 16,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  rewardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: ChildColors.galoDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 24,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: ChildColors.textPrimary,
    marginBottom: 4,
  },
  rewardCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardStarIcon: {
    fontSize: 16,
    color: ChildColors.starGold,
  },
  rewardCost: {
    fontSize: 16,
    fontWeight: '700',
    color: ChildColors.starGold,
  },
  redeemButton: {
    backgroundColor: ChildColors.starGold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: ChildColors.textMuted,
  },
  redeemButtonUnavailable: {
    backgroundColor: ChildColors.textMuted,
    opacity: 0.5,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ChildColors.galoBlack,
  },
  redeemButtonTextDisabled: {
    color: ChildColors.textSecondary,
  },
  redeemButtonTextUnavailable: {
    color: ChildColors.textSecondary,
  },
  noRewardsCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
    marginBottom: 24,
  },
  noRewardsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noRewardsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  noRewardsMessage: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    textAlign: 'center',
  },
  
  // Achievement Badges
  badgeRow: {
    marginBottom: 16,
  },
  badgeCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ChildColors.starGold,
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeDesc: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    textAlign: 'center',
  },
  
  // Bottom Navigation
  hojeButton: {
    backgroundColor: ChildColors.starGold,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  hojeButtonPressed: {
    backgroundColor: ChildColors.starGoldDark,
    transform: [{ scale: 0.98 }],
  },
  hojeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: ChildColors.galoBlack,
  },
});