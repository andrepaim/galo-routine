import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Icon, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Layout, PIN_LENGTH } from '../../constants';
import { useAuthStore } from '../../lib/stores';

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
          setError('Wrong PIN. Try again!');
          setPin('');
        }
      } catch {
        setError('Something went wrong');
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
        <Icon source="account-child-circle" size={80} color={Colors.secondary} />
        <Text variant="headlineMedium" style={styles.greeting}>
          Hi{childName ? `, ${childName}` : ''}!
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Enter your PIN
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
                <Icon source="backspace" size={28} color={pin.length > 0 ? Colors.text : Colors.textLight} />
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
      >
        Go Back
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.padding.lg,
  },
  greeting: {
    fontWeight: 'bold',
    color: Colors.secondaryDark,
    marginTop: Layout.padding.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
  },
  dots: {
    flexDirection: 'row',
    gap: Layout.padding.md,
    marginBottom: Layout.padding.md,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.secondary,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.secondary,
  },
  dotError: {
    borderColor: Colors.penalty,
    backgroundColor: Colors.penaltyLight,
  },
  error: {
    color: Colors.penalty,
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
    marginTop: Layout.padding.md,
  },
  key: {
    width: 80,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  digitKey: {
    borderRadius: Layout.radius.lg,
    backgroundColor: Colors.surface,
    elevation: 1,
  },
  keyPressed: {
    backgroundColor: Colors.secondaryLight,
  },
  digitText: {
    fontWeight: 'bold',
    color: Colors.text,
  },
  back: {
    marginTop: Layout.padding.lg,
  },
});
