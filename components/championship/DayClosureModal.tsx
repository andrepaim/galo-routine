import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { ChildColors } from '../../constants';
import { MatchResult } from '../../lib/types/championship';
import { getResultText, getResultMessage, getPositionChangeText } from '../../lib/services/matchService';

interface DayClosureModalProps {
  visible: boolean;
  result: MatchResult | null;
  userName: string;
  onViewTable: () => void;
  onDismiss: () => void;
}

const { width } = Dimensions.get('window');

export function DayClosureModal({
  visible,
  result,
  userName,
  onViewTable,
  onDismiss,
}: DayClosureModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const mascotAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (visible && result) {
      // Sequence of animations
      Animated.sequence([
        // Scale in the modal
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        // Show score with bounce
        Animated.spring(scoreAnim, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }),
        // Show mascot
        Animated.spring(mascotAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Bounce animation for win
      if (result.result === 'W') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1.1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    } else {
      scaleAnim.setValue(0);
      scoreAnim.setValue(0);
      mascotAnim.setValue(0);
      bounceAnim.setValue(1);
    }
  }, [visible, result]);
  
  if (!result) return null;
  
  const resultText = getResultText(result.result);
  const message = getResultMessage(result.result, result.newPosition);
  const positionText = getPositionChangeText(result.positionChange);
  
  const getMascotEmoji = () => {
    switch (result.result) {
      case 'W': return '🐓🎉';
      case 'D': return '🐓';
      case 'L': return '🐓💪';
    }
  };
  
  const getResultColor = () => {
    switch (result.result) {
      case 'W': return '#2ECC71';
      case 'D': return ChildColors.starGold;
      case 'L': return '#E74C3C';
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Result Header */}
          <Text style={[styles.resultText, { color: getResultColor() }]}>
            {result.result === 'W' && '🎉 '}
            {resultText}
            {result.result === 'W' && ' 🎉'}
          </Text>
          
          {/* Score */}
          <Animated.View 
            style={[
              styles.scoreContainer,
              { 
                opacity: scoreAnim,
                transform: [{ scale: scoreAnim }]
              }
            ]}
          >
            <View style={styles.scoreRow}>
              <Text style={styles.teamNameScore}>{userName}</Text>
              <View style={styles.scoreNumbers}>
                <Text style={styles.scoreNumber}>{result.userGoals}</Text>
                <Text style={styles.scoreBall}>⚽</Text>
                <Text style={styles.scoreNumber}>{result.opponentGoals}</Text>
              </View>
              <Text style={styles.teamNameScore}>{result.opponentName}</Text>
            </View>
          </Animated.View>
          
          {/* Mascot */}
          <Animated.View 
            style={[
              styles.mascotContainer,
              { 
                opacity: mascotAnim,
                transform: [
                  { scale: Animated.multiply(mascotAnim, bounceAnim) }
                ]
              }
            ]}
          >
            <Text style={styles.mascot}>{getMascotEmoji()}</Text>
          </Animated.View>
          
          {/* Position Update */}
          <View style={styles.positionContainer}>
            <Text style={styles.positionText}>{positionText}</Text>
            <Text style={styles.messageText}>{message}</Text>
          </View>
          
          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity 
              style={styles.tableButton} 
              onPress={onViewTable}
            >
              <Text style={styles.tableButtonText}>📊 VER TABELA</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onDismiss}
            >
              <Text style={styles.closeButtonText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: ChildColors.galoBlack,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ChildColors.starGold,
  },
  resultText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  scoreContainer: {
    marginBottom: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamNameScore: {
    color: ChildColors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    width: 80,
    textAlign: 'center',
  },
  scoreNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  scoreNumber: {
    color: ChildColors.starGold,
    fontSize: 48,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'center',
  },
  scoreBall: {
    fontSize: 32,
    marginHorizontal: 8,
  },
  mascotContainer: {
    marginBottom: 24,
  },
  mascot: {
    fontSize: 64,
  },
  positionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  positionText: {
    color: ChildColors.textPrimary,
    fontSize: 18,
    marginBottom: 8,
  },
  messageText: {
    color: ChildColors.starGold,
    fontSize: 16,
    fontWeight: '600',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  tableButton: {
    backgroundColor: ChildColors.starGold,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  tableButtonText: {
    color: ChildColors.galoBlack,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ChildColors.textSecondary,
  },
  closeButtonText: {
    color: ChildColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DayClosureModal;
