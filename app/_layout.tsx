import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { useAuthStore } from '../lib/stores';
import { useSubscriptions } from '../lib/hooks';
import { LoadingScreen } from '../components/ui/LoadingScreen';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, role } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onChildPin = (segments as string[]).includes('child-pin');

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup && !onChildPin) {
      // Don't redirect away from child-pin — user is entering their PIN
      if (role === 'child') {
        router.replace('/(child)');
      } else {
        router.replace('/(parent)');
      }
    }
  }, [isAuthenticated, isLoading, role, segments]);

  return null;
}

function DataSubscriptions() {
  useSubscriptions();
  return null;
}

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.initAuth);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <LoadingScreen message="Starting Star Routine..." />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="dark" />
          <AuthGate />
          {isAuthenticated && <DataSubscriptions />}
          <Slot />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
