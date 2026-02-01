import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout } from '../../constants';
import { useAuthStore } from '../../lib/stores';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setRole = useAuthStore((s) => s.setRole);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      await setRole('parent');
      router.replace('/(parent)');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChildMode = async () => {
    if (isAuthenticated) {
      // Already logged in, go straight to PIN
      router.push('/(auth)/child-pin');
    } else if (email.trim() && password) {
      // Log in first, then go to PIN entry
      setError('');
      setLoading(true);
      try {
        await login(email.trim(), password);
        router.replace('/(auth)/child-pin');
      } catch (e: any) {
        setError(e.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Enter email and password first, then tap "I\'m the Child"');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Icon source="star-shooting" size={64} color={Colors.primary} />
          <Text variant="headlineLarge" style={styles.title}>
            Star Routine
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Track tasks, earn stars!
          </Text>
        </View>

        <View style={styles.form}>
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

          {error ? (
            <Text variant="bodySmall" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Log In as Parent
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/(auth)/register')}
            style={styles.link}
          >
            Create Family Account
          </Button>
        </View>

        <View style={styles.childSection}>
          <Button
            mode="outlined"
            icon="account-child"
            onPress={handleChildMode}
            style={styles.childButton}
          >
            I'm the Child
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Layout.padding.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.padding.xl,
  },
  title: {
    marginTop: Layout.padding.md,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: Layout.padding.xs,
  },
  form: {
    gap: Layout.padding.sm,
  },
  input: {
    backgroundColor: Colors.surface,
  },
  error: {
    color: Colors.error,
    textAlign: 'center',
  },
  button: {
    marginTop: Layout.padding.sm,
  },
  link: {
    marginTop: Layout.padding.xs,
  },
  childSection: {
    marginTop: Layout.padding.xl,
    alignItems: 'center',
  },
  childButton: {
    borderColor: Colors.secondary,
  },
});
