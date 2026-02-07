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
import { TeamProfile } from '../../constants/leagueConfig';

interface RivalRevealProps {
  visible: boolean;
  opponentName: string;
  opponentProfile: TeamProfile;
  onDismiss: () => void;
}

const { width, height } = Dimensions.get('window');

// Get strength display (number of balls)
function getStrengthBalls(profile: TeamProfile): number {
  switch (profile) {
    case 'weak': return 1;
    case 'medium': return 2;
    case 'strong': return 3;
    case 'elite': return 4;
    default: return 2;
  }
}

export function RivalReveal({
  visible,
  opponentName,
  opponentProfile,
  onDismiss,
}: RivalRevealProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Pulse button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
    }
  }, [visible]);
  
  const strengthBalls = getStrengthBalls(opponentProfile);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={styles.header}>🏟️ PARTIDA DE HOJE 🏟️</Text>
          
          <Text style={styles.subtitle}>Você enfrenta:</Text>
          
          <Animated.View 
            style={[
              styles.rivalCard,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.shieldPlaceholder}>
              <Text style={styles.shieldEmoji}>⚔️</Text>
            </View>
            
            <Text style={styles.rivalName}>{opponentName}</Text>
            
            <View style={styles.strengthRow}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Text 
                  key={i} 
                  style={[
                    styles.strengthBall,
                    i < strengthBalls ? styles.strengthActive : styles.strengthInactive
                  ]}
                >
                  ⚽
                </Text>
              ))}
            </View>
            
            <Text style={styles.strengthLabel}>
              {opponentProfile === 'weak' && 'Time Fraco'}
              {opponentProfile === 'medium' && 'Time Médio'}
              {opponentProfile === 'strong' && 'Time Forte'}
              {opponentProfile === 'elite' && 'Time Elite'}
            </Text>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.button} onPress={onDismiss}>
              <Text style={styles.buttonText}>BORA JOGAR! 🐓</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ChildColors.starGold,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: ChildColors.textSecondary,
    marginBottom: 20,
  },
  rivalCard: {
    backgroundColor: ChildColors.cardBackground,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  shieldPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ChildColors.galoBlack,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: ChildColors.starGold,
  },
  shieldEmoji: {
    fontSize: 40,
  },
  rivalName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  strengthRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  strengthBall: {
    fontSize: 24,
    marginHorizontal: 4,
  },
  strengthActive: {
    opacity: 1,
  },
  strengthInactive: {
    opacity: 0.2,
  },
  strengthLabel: {
    fontSize: 14,
    color: ChildColors.textSecondary,
    fontWeight: '600',
  },
  button: {
    backgroundColor: ChildColors.starGold,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: ChildColors.galoBlack,
  },
});

export default RivalReveal;
