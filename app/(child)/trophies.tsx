import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Surface } from 'react-native-paper';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { ChildColors } from '../../constants';
import { Trophy } from '../../lib/types/championship';

// Mock trophies for dev mode
const mockTrophies: Trophy[] = [
  { id: '1', familyId: 'f1', childId: 'c1', type: 'championship', championshipId: 'ch1', league: 'D', earnedAt: null as any, title: 'Campeão Série D - Janeiro 2026' },
];

const mockWeeklyTrophies = [true, true, false, false];

export default function TrophiesScreen() {
  const isDevMode = typeof window !== 'undefined' && window.location.search.includes('dev=');
  
  const trophies = isDevMode ? mockTrophies : mockTrophies; // TODO: real data
  const weeklyTrophies = isDevMode ? mockWeeklyTrophies : [];
  
  // Mock stats
  const stats = {
    totalWins: 23,
    totalGoals: 87,
    bestGoleada: '7 x 1',
    currentLeague: 'Série D',
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <Text style={styles.header}>🏆 SALA DE TROFÉUS</Text>
      </Animated.View>
      
      {/* Championship Titles */}
      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <Text style={styles.sectionTitle}>TÍTULOS</Text>
        
        {trophies.filter(t => t.type === 'championship').length > 0 ? (
          trophies.filter(t => t.type === 'championship').map((trophy, index) => (
            <Surface key={trophy.id} style={styles.trophyCard} elevation={0}>
              <View style={styles.trophyIcon}>
                <Text style={styles.trophyEmoji}>🏆</Text>
              </View>
              <View style={styles.trophyInfo}>
                <Text style={styles.trophyTitle}>{trophy.title}</Text>
                <Text style={styles.trophySubtitle}>{trophy.league}</Text>
              </View>
            </Surface>
          ))
        ) : (
          <Surface style={styles.emptyCard} elevation={0}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyText}>Seu primeiro título está a caminho!</Text>
            <Text style={styles.emptySubtext}>Termine no topo da tabela no fim do mês</Text>
          </Surface>
        )}
      </Animated.View>
      
      {/* Weekly Trophies */}
      <Animated.View entering={FadeInUp.delay(200).duration(500)}>
        <Text style={styles.sectionTitle}>TROFÉUS SEMANAIS</Text>
        
        <View style={styles.weeklyRow}>
          {[1, 2, 3, 4].map((week) => {
            const hasWon = weeklyTrophies[week - 1];
            return (
              <View key={week} style={styles.weeklyItem}>
                <View style={[styles.weeklyTrophy, hasWon && styles.weeklyTrophyWon]}>
                  <Text style={styles.weeklyEmoji}>{hasWon ? '🏆' : '⬜'}</Text>
                </View>
                <Text style={styles.weeklyLabel}>Sem. {week}</Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
      
      {/* Stats */}
      <Animated.View entering={FadeInUp.delay(300).duration(500)}>
        <Text style={styles.sectionTitle}>ESTATÍSTICAS</Text>
        
        <Surface style={styles.statsCard} elevation={0}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>⚽ Vitórias</Text>
            <Text style={styles.statValue}>{stats.totalWins}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>🥅 Gols marcados</Text>
            <Text style={styles.statValue}>{stats.totalGoals}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>💥 Maior goleada</Text>
            <Text style={styles.statValue}>{stats.bestGoleada}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>🏟️ Liga atual</Text>
            <Text style={[styles.statValue, styles.leagueValue]}>{stats.currentLeague}</Text>
          </View>
        </Surface>
      </Animated.View>
      
      {/* Current League Badge */}
      <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.badgeContainer}>
        <Surface style={styles.badgeCard} elevation={0}>
          <Text style={styles.badgeEmoji}>🏟️</Text>
          <Text style={styles.badgeTitle}>{stats.currentLeague}</Text>
          <Text style={styles.badgeSubtitle}>Liga Atual</Text>
        </Surface>
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
    fontSize: 28,
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
  trophyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
  },
  trophyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ChildColors.galoBlack,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trophyEmoji: {
    fontSize: 32,
  },
  trophyInfo: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.textPrimary,
    marginBottom: 4,
  },
  trophySubtitle: {
    fontSize: 14,
    color: ChildColors.textSecondary,
  },
  emptyCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: ChildColors.textPrimary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: ChildColors.textSecondary,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weeklyItem: {
    alignItems: 'center',
  },
  weeklyTrophy: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ChildColors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: ChildColors.cardBorder,
  },
  weeklyTrophyWon: {
    borderColor: ChildColors.starGold,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  weeklyEmoji: {
    fontSize: 28,
  },
  weeklyLabel: {
    fontSize: 12,
    color: ChildColors.textSecondary,
  },
  statsCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 16,
    color: ChildColors.textPrimary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ChildColors.starGold,
  },
  leagueValue: {
    color: ChildColors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: ChildColors.cardBorder,
  },
  badgeContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  badgeCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ChildColors.starGold,
    minWidth: 150,
  },
  badgeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: ChildColors.starGold,
    marginBottom: 4,
  },
  badgeSubtitle: {
    fontSize: 14,
    color: ChildColors.textSecondary,
  },
});
