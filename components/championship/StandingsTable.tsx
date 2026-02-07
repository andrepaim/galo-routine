import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ChildColors } from '../../constants';
import { Standing } from '../../lib/types/championship';
import { LeagueId, LEAGUE_CONFIG } from '../../constants/leagueConfig';

interface StandingsTableProps {
  standings: Standing[];
  league: LeagueId;
  userId: string;
  currentRound: number;
  totalRounds?: number;
}

export function StandingsTable({
  standings,
  league,
  userId,
  currentRound,
  totalRounds = 4,
}: StandingsTableProps) {
  const leagueConfig = LEAGUE_CONFIG[league];
  const promotionSpots = leagueConfig.promotionSpots;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.leagueName}>📊 {leagueConfig.name}</Text>
        <Text style={styles.roundInfo}>Rodada {currentRound} de {totalRounds}</Text>
      </View>
      
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.posCell]}>Pos</Text>
        <Text style={[styles.headerCell, styles.teamCell]}>Time</Text>
        <Text style={[styles.headerCell, styles.statCell]}>P</Text>
        <Text style={[styles.headerCell, styles.statCell]}>V</Text>
        <Text style={[styles.headerCell, styles.statCell]}>E</Text>
        <Text style={[styles.headerCell, styles.statCell]}>D</Text>
        <Text style={[styles.headerCell, styles.sgCell]}>SG</Text>
        <Text style={[styles.headerCell, styles.ptsCell]}>Pts</Text>
      </View>
      
      <ScrollView style={styles.tableBody}>
        {standings.map((standing) => {
          const isUser = standing.teamId === userId;
          const inPromotionZone = standing.position <= promotionSpots && league !== 'A';
          
          return (
            <View 
              key={standing.teamId}
              style={[
                styles.row,
                isUser && styles.userRow,
                inPromotionZone && styles.promotionRow,
              ]}
            >
              <View style={[styles.cell, styles.posCell]}>
                {inPromotionZone && <Text style={styles.promotionDot}>🟢</Text>}
                <Text style={[styles.cellText, isUser && styles.userText]}>
                  {standing.position}
                </Text>
              </View>
              
              <View style={[styles.cell, styles.teamCell]}>
                <Text 
                  style={[styles.cellText, styles.teamName, isUser && styles.userText]}
                  numberOfLines={1}
                >
                  {standing.teamName}
                  {isUser && ' ⭐'}
                </Text>
              </View>
              
              <Text style={[styles.cell, styles.statCell, styles.cellText, isUser && styles.userText]}>
                {standing.played}
              </Text>
              <Text style={[styles.cell, styles.statCell, styles.cellText, isUser && styles.userText]}>
                {standing.won}
              </Text>
              <Text style={[styles.cell, styles.statCell, styles.cellText, isUser && styles.userText]}>
                {standing.drawn}
              </Text>
              <Text style={[styles.cell, styles.statCell, styles.cellText, isUser && styles.userText]}>
                {standing.lost}
              </Text>
              <Text style={[
                styles.cell, 
                styles.sgCell, 
                styles.cellText, 
                isUser && styles.userText,
                standing.goalDifference > 0 && styles.positiveGD,
                standing.goalDifference < 0 && styles.negativeGD,
              ]}>
                {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
              </Text>
              <Text style={[
                styles.cell, 
                styles.ptsCell, 
                styles.cellText, 
                styles.pointsText,
                isUser && styles.userText
              ]}>
                {standing.points}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      
      {league !== 'A' && (
        <View style={styles.legend}>
          <Text style={styles.legendText}>🟢 = Zona de promoção</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: ChildColors.cardBorder,
  },
  leagueName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: ChildColors.starGold,
    marginBottom: 4,
  },
  roundInfo: {
    fontSize: 14,
    color: ChildColors.textSecondary,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: ChildColors.cardBackground,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: ChildColors.cardBorder,
  },
  headerCell: {
    color: ChildColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tableBody: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: ChildColors.cardBorder,
    alignItems: 'center',
  },
  userRow: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },
  promotionRow: {
    borderLeftWidth: 3,
    borderLeftColor: '#2ECC71',
  },
  cell: {
    justifyContent: 'center',
  },
  cellText: {
    color: ChildColors.textPrimary,
    fontSize: 14,
  },
  userText: {
    fontWeight: 'bold',
    color: ChildColors.starGold,
  },
  posCell: {
    width: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promotionDot: {
    fontSize: 8,
    marginRight: 4,
  },
  teamCell: {
    flex: 1,
    paddingRight: 8,
  },
  teamName: {
    fontWeight: '500',
  },
  statCell: {
    width: 28,
    textAlign: 'center',
  },
  sgCell: {
    width: 36,
    textAlign: 'center',
  },
  ptsCell: {
    width: 36,
    textAlign: 'center',
  },
  pointsText: {
    fontWeight: 'bold',
  },
  positiveGD: {
    color: '#2ECC71',
  },
  negativeGD: {
    color: '#E74C3C',
  },
  legend: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: ChildColors.cardBorder,
    backgroundColor: ChildColors.cardBackground,
  },
  legendText: {
    fontSize: 12,
    color: ChildColors.textSecondary,
  },
});

export default StandingsTable;
