import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { ChildColors, ChildSizes } from '../../constants';
import { StandingsTable } from '../../components/championship';
import { useChampionship } from '../../lib/hooks';
import { useAuthStore } from '../../lib/stores';
import { Standing } from '../../lib/types/championship';
import { LeagueId } from '../../constants/leagueConfig';

const { width } = Dimensions.get('window');

// Mock data for development
const mockStandings: Standing[] = [
  { teamId: 'vitor', teamName: 'Vitor', isUser: true, played: 5, won: 4, drawn: 1, lost: 0, goalsFor: 18, goalsAgainst: 6, goalDifference: 12, points: 13, position: 1 },
  { teamId: 'palmeiras', teamName: 'Palmeiras', isUser: false, played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 12, goalsAgainst: 8, goalDifference: 4, points: 10, position: 2 },
  { teamId: 'flamengo', teamName: 'Flamengo', isUser: false, played: 5, won: 3, drawn: 0, lost: 2, goalsFor: 10, goalsAgainst: 9, goalDifference: 1, points: 9, position: 3 },
  { teamId: 'santos', teamName: 'Santos', isUser: false, played: 5, won: 2, drawn: 2, lost: 1, goalsFor: 8, goalsAgainst: 7, goalDifference: 1, points: 8, position: 4 },
];

// Mock weekly results for the past week
const mockWeeklyResults = [
  { day: 'SEG', goals: 3, result: 'VITÓRIA', emoji: '🏆' },
  { day: 'TER', goals: 2, result: 'VITÓRIA', emoji: '🏆' },
  { day: 'QUA', goals: 1, result: 'DERROTA', emoji: '😢' },
  { day: 'QUI', goals: 4, result: 'VITÓRIA', emoji: '🏆' },
  { day: 'SEX', goals: 2, result: 'EMPATE', emoji: '😐' },
  { day: 'SAB', goals: 3, result: 'VITÓRIA', emoji: '🏆' },
  { day: 'DOM', goals: 0, result: '-', emoji: '⚽' }, // Today
];

export default function ProgressScreen() {
  const { championship, standings, isLoading } = useChampionship();
  const familyId = useAuthStore((s) => s.familyId);
  const childName = useAuthStore((s) => s.childName);
  const family = useAuthStore((s) => s.family);
  
  // Check if in dev mode
  const isDevMode = typeof window !== 'undefined' && window.location.search.includes('dev=');
  
  // Use real data if available, otherwise fall back to mock in dev mode
  const displayStandings = standings.length > 0 ? standings : (isDevMode ? mockStandings : []);
  const league: LeagueId = championship?.league || 'D';
  const userId = championship?.childId || (isDevMode ? 'vitor' : familyId || '');
  const currentRound = championship?.currentRound || (isDevMode ? 2 : 1);
  
  // Calculate current stats
  const totalStars = family?.starBalance || 87;
  const nextRewardAt = 100; // Mock value
  const rewardProgress = Math.min((totalStars / nextRewardAt) * 100, 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={styles.header}>📊 SEU PROGRESSO</Text>
      </Animated.View>
      
      {/* Weekly View */}
      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <Text style={styles.sectionTitle}>ESTA SEMANA</Text>
        
        <Surface style={styles.weeklyCard} elevation={0}>
          <View style={styles.weeklyRow}>
            {mockWeeklyResults.map((day, index) => {
              const isToday = day.day === 'DOM';
              return (
                <View key={day.day} style={styles.dayColumn}>
                  <Text style={styles.dayLabel}>{day.day}</Text>
                  <View style={[styles.dayResult, isToday && styles.todayResult]}>
                    <Text style={styles.dayEmoji}>{day.emoji}</Text>
                    <View style={styles.goalBalls}>
                      {[1, 2, 3].map((ball) => (
                        <Text key={ball} style={styles.goalBall}>
                          {ball <= day.goals ? '⚽' : '⚪'}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.resultText, isToday && styles.todayText]}>
                    {day.result}
                  </Text>
                </View>
              );
            })}
          </View>
        </Surface>
      </Animated.View>
      
      {/* Mini Standings */}
      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <Text style={styles.sectionTitle}>CLASSIFICAÇÃO</Text>
        
        <Surface style={styles.standingsCard} elevation={0}>
          {displayStandings.slice(0, 5).map((team, index) => {
            const isUser = team.teamId === userId;
            const isTopThree = index < 3;
            
            return (
              <View key={team.teamId} style={[styles.teamRow, isUser && styles.userTeamRow]}>
                <View style={styles.positionSection}>
                  <Text style={[styles.position, isUser && styles.userPosition]}>
                    {team.position}
                  </Text>
                  {isTopThree && (
                    <Text style={styles.positionEmoji}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </Text>
                  )}
                </View>
                
                <Text 
                  style={[
                    styles.teamName, 
                    isUser && styles.userTeamName
                  ]} 
                  numberOfLines={1}
                >
                  {team.teamName}
                  {isUser && ' ⭐'}
                </Text>
                
                <Text style={[styles.points, isUser && styles.userPoints]}>
                  {team.points} pts
                </Text>
              </View>
            );
          })}
          
          <View style={styles.leagueInfo}>
            <Text style={styles.leagueText}>🏟️ Série {league} - Rodada {currentRound}</Text>
          </View>
        </Surface>
      </Animated.View>
      
      {/* Reward Progress */}
      <Animated.View entering={FadeInUp.delay(300).duration(500)}>
        <Text style={styles.sectionTitle}>PRÓXIMA RECOMPENSA</Text>
        
        <Surface style={styles.rewardCard} elevation={0}>
          <View style={styles.rewardHeader}>
            <Text style={styles.rewardEmoji}>🎁</Text>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Novo Jogo</Text>
              <Text style={styles.rewardSubtitle}>Faltam {nextRewardAt - totalStars} estrelas</Text>
            </View>
            <Text style={styles.rewardPercent}>{Math.round(rewardProgress)}%</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${rewardProgress}%` }
              ]} 
            />
            <View style={styles.progressStars}>
              {Array.from({ length: 10 }, (_, i) => (
                <Text key={i} style={styles.progressStar}>
                  {i < (rewardProgress / 10) ? '⭐' : '⚫'}
                </Text>
              ))}
            </View>
          </View>
        </Surface>
      </Animated.View>
      
      {/* Stats Summary */}
      <Animated.View entering={FadeInUp.delay(400).duration(500)}>
        <Text style={styles.sectionTitle}>ESTATÍSTICAS</Text>
        
        <View style={styles.statsRow}>
          <Surface style={styles.statCard} elevation={0}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Vitórias esta semana</Text>
          </Surface>
          
          <Surface style={styles.statCard} elevation={0}>
            <Text style={styles.statEmoji}>⚽</Text>
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>Gols marcados</Text>
          </Surface>
        </View>
        
        <View style={styles.statsRow}>
          <Surface style={styles.statCard} elevation={0}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{family?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Sequência</Text>
          </Surface>
          
          <Surface style={styles.statCard} elevation={0}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNumber}>{totalStars}</Text>
            <Text style={styles.statLabel}>Estrelas totais</Text>
          </Surface>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ChildColors.starGold,
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ChildColors.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  
  // Weekly View
  weeklyCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    color: ChildColors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  dayResult: {
    alignItems: 'center',
    backgroundColor: ChildColors.galoBlack,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    minHeight: 60,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  todayResult: {
    borderColor: ChildColors.starGold,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  dayEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  goalBalls: {
    flexDirection: 'row',
    gap: 2,
  },
  goalBall: {
    fontSize: 8,
  },
  resultText: {
    fontSize: 10,
    color: ChildColors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  todayText: {
    color: ChildColors.starGold,
  },
  
  // Mini Standings
  standingsCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ChildColors.cardBorder,
  },
  userTeamRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    borderBottomColor: 'transparent',
  },
  positionSection: {
    width: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  position: {
    fontSize: 16,
    fontWeight: '700',
    color: ChildColors.textPrimary,
    minWidth: 20,
  },
  userPosition: {
    color: ChildColors.starGold,
  },
  positionEmoji: {
    fontSize: 12,
    marginLeft: 4,
  },
  teamName: {
    flex: 1,
    fontSize: 16,
    color: ChildColors.textPrimary,
    fontWeight: '500',
  },
  userTeamName: {
    color: ChildColors.starGold,
    fontWeight: '700',
  },
  points: {
    fontSize: 14,
    fontWeight: '600',
    color: ChildColors.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },
  userPoints: {
    color: ChildColors.starGold,
  },
  leagueInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ChildColors.cardBorder,
    alignItems: 'center',
  },
  leagueText: {
    fontSize: 14,
    color: ChildColors.textSecondary,
  },
  
  // Reward Progress
  rewardCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: ChildSizes.cardRadius,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: ChildColors.starGold,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
  },
  rewardSubtitle: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    marginTop: 2,
  },
  rewardPercent: {
    fontSize: 20,
    fontWeight: '800',
    color: ChildColors.starGold,
  },
  progressBar: {
    height: 20,
    backgroundColor: ChildColors.galoBlack,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ChildColors.starGold,
    borderRadius: 10,
  },
  progressStars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  progressStar: {
    fontSize: 12,
  },
  
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
    textAlign: 'center',
  },
});