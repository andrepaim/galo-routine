import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout, PIN_LENGTH } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
import { useAuthStore } from '../../lib/stores';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childPin, setChildPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleRegister = async () => {
    if (!parentName.trim() || !childName.trim() || !email.trim() || !password || !childPin) {
      setError('Please fill in all fields');
      return;
    }
    if (childPin.length < PIN_LENGTH) {
      setError(`PIN must be ${PIN_LENGTH} digits`);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        parentName: parentName.trim(),
        childName: childName.trim(),
        childPin,
      });
      router.replace('/(parent)');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="bodyLarge" style={styles.description}>
            Create an account for your family. Both parent and child will use this account.
          </Text>

          <TextInput
            label="Parent's Name"
            value={parentName}
            onChangeText={setParentName}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
            style={styles.input}
          />

          <TextInput
            label="Child's Name"
            value={childName}
            onChangeText={setChildName}
            mode="outlined"
            left={<TextInput.Icon icon="account-child" />}
            style={styles.input}
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={secureText}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={secureText ? 'eye' : 'eye-off'}
                onPress={() => setSecureText(!secureText)}
              />
            }
            style={styles.input}
          />

          <TextInput
            label={`Child's PIN (${PIN_LENGTH} digits)`}
            value={childPin}
            onChangeText={(t) => setChildPin(t.replace(/[^0-9]/g, '').slice(0, 6))}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={6}
            left={<TextInput.Icon icon="shield-key" />}
            style={styles.input}
          />
          <Text variant="bodySmall" style={styles.hint}>
            This PIN allows your child to access their view on a separate device.
          </Text>

          {error ? (
            <Text variant="bodySmall" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Create Family Account
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildColors.galoBlack,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: Layout.padding.lg,
    gap: Layout.padding.sm,
  },
  description: {
    color: ChildColors.textPrimarySecondary,
    marginBottom: Layout.padding.md,
  },
  input: {
    backgroundColor: ChildColors.cardBackground,
  },
  hint: {
    color: ChildColors.textPrimarySecondary,
    marginTop: -4,
    marginLeft: Layout.padding.xs,
  },
  error: {
    color: ChildColors.accentRed,
    textAlign: 'center',
  },
  button: {
    marginTop: Layout.padding.md,
  },
});
