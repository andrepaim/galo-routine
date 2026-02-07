import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChildColors } from '../../constants';

interface LiveScoreboardProps {
  userName: string;
  userGoals: number;
  opponentName: string;
  opponentGoals: number;
  isLive?: boolean;  // true = match in progress, false = final score
  onPress?: () => void;
}

export function LiveScoreboard({
  userName,
  userGoals,
  opponentName,
  opponentGoals,
  isLive = true,
  onPress,
}: LiveScoreboardProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {isLive && <View style={styles.liveBadge}><Text style={styles.liveText}>AO VIVO</Text></View>}
      
      <View style={styles.scoreRow}>
        <View style={styles.teamSection}>
          <Text style={styles.teamName} numberOfLines={1}>{userName}</Text>
        </View>
        
        <View style={styles.scoreSection}>
          <Text style={styles.score}>{userGoals}</Text>
          <Text style={styles.ballEmoji}>⚽</Text>
          <Text style={styles.score}>{opponentGoals}</Text>
        </View>
        
        <View style={styles.teamSection}>
          <Text style={[styles.teamName, styles.opponentName]} numberOfLines={1}>
            {opponentName}
          </Text>
        </View>
      </View>
      
      <View style={styles.divider} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ChildColors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: ChildColors.cardBorder,
  },
  liveBadge: {
    position: 'absolute',
    top: 4,
    right: 8,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 28,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  ballEmoji: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  divider: {
    height: 2,
    backgroundColor: ChildColors.starGold,
    marginTop: 8,
    borderRadius: 1,
  },
});

export default LiveScoreboard;
