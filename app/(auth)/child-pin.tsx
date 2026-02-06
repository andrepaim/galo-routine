import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Text, Icon, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { PIN_LENGTH } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { useAuthStore } from '../../lib/stores';

// Galo mascot
const GaloVolpi = require('../../assets/images/mascot/galo-volpi-white.png');

export default function ChildPinScreen() {
  const router = useRouter();
  const checkChildPin = useAuthStore((s) => s.checkChildPin);
  const setRole = useAuthStore((s) => s.setRole);
  const childName = useAuthStore((s) => s.childName);

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDigit = useCallback(async (digit: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === PIN_LENGTH) {
      setLoading(true);
      try {
        const valid = await checkChildPin(newPin);
        if (valid) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await setRole('child');
          router.replace('/(child)');
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError('PIN errado. Tenta de novo!');
          setPin('');
        }
      } catch {
        setError('Algo deu errado');
        setPin('');
      } finally {
        setLoading(false);
      }
    }
  }, [pin]);

  const handleDelete = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPin((p) => p.slice(0, -1));
    setError('');
  }, []);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={GaloVolpi} style={styles.mascot} resizeMode="contain" />
        <Text variant="headlineMedium" style={styles.greeting}>
          E aí{childName ? `, ${childName}` : ''}!
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Digite seu PIN
        </Text>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length && styles.dotFilled,
              error ? styles.dotError : null,
            ]}
          />
        ))}
      </View>

      {error ? (
        <Text variant="bodyMedium" style={styles.error}>
          {error}
        </Text>
      ) : (
        <View style={styles.errorPlaceholder} />
      )}

      <View style={styles.keypad}>
        {digits.map((d, i) => {
          if (d === '') return <View key={i} style={styles.key} />;
          if (d === 'del') {
            return (
              <Pressable
                key={i}
                style={styles.key}
                onPress={handleDelete}
                disabled={pin.length === 0}
              >
                <Icon 
                  source="backspace" 
                  size={28} 
                  color={pin.length > 0 ? ChildColors.textPrimary : ChildColors.textMuted} 
                />
              </Pressable>
            );
          }
          return (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.key, styles.digitKey, pressed && styles.keyPressed]}
              onPress={() => handleDigit(d)}
              disabled={loading || pin.length >= PIN_LENGTH}
            >
              <Text variant="headlineMedium" style={styles.digitText}>
                {d}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        mode="text"
        onPress={() => router.back()}
        style={styles.back}
        textColor={ChildColors.starGold}
      >
        Voltar
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  mascot: {
    width: 80,
    height: 130,
    marginBottom: 16,
  },
  greeting: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
    marginTop: 8,
  },
  subtitle: {
    color: ChildColors.textSecondary,
    marginTop: 4,
  },
  dots: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: ChildColors.starGold,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: ChildColors.starGold,
  },
  dotError: {
    borderColor: ChildColors.accentRed,
    backgroundColor: ChildColors.accentRed,
  },
  error: {
    color: ChildColors.accentRed,
    height: 24,
    textAlign: 'center',
  },
  errorPlaceholder: {
    height: 24,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    justifyContent: 'center',
    marginTop: 16,
  },
  key: {
    width: 80,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  digitKey: {
    borderRadius: ChildSizes.cardRadius,
    backgroundColor: ChildColors.cardBackground,
    borderWidth: 1,
    borderColor: ChildColors.cardBorder,
  },
  keyPressed: {
    backgroundColor: ChildColors.starGold,
  },
  digitText: {
    fontWeight: 'bold',
    color: ChildColors.textPrimary,
  },
  back: {
    marginTop: 32,
  },
});
