import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { TextInput, Button, Text, Icon } from 'react-native-paper';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout } from '../../constants';
import { ChildColors, ChildSizes } from '../../constants/childTheme';
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
          <Icon source="shield-star" size={64} color={ChildColors.starGold} />
          <Text variant="headlineLarge" style={styles.title}>
            Galo Routine
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Complete tarefas, marque gols!
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

          <Link href="/(auth)/register" asChild>
            <Pressable style={styles.link}>
              <Text style={styles.linkText}>Create Family Account</Text>
            </Pressable>
          </Link>
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
    backgroundColor: ChildColors.galoBlack,
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
    color: ChildColors.starGoldDark,
  },
  subtitle: {
    color: ChildColors.textSecondary,
    marginTop: Layout.padding.xs,
  },
  form: {
    gap: Layout.padding.sm,
  },
  input: {
    backgroundColor: ChildColors.cardBackground,
  },
  error: {
    color: ChildColors.accentRed,
    textAlign: 'center',
  },
  button: {
    marginTop: Layout.padding.sm,
  },
  link: {
    marginTop: Layout.padding.xs,
    alignSelf: 'center',
    paddingVertical: Layout.padding.sm,
  },
  linkText: {
    color: ChildColors.starGold,
    fontSize: 14,
    fontWeight: '500',
  },
  childSection: {
    marginTop: Layout.padding.xl,
    alignItems: 'center',
  },
  childButton: {
    borderColor: ChildColors.starGold,
  },
});
