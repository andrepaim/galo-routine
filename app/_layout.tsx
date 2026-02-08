import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { useAuthStore } from '../lib/stores';
import { useSubscriptions, useGoalBudgetSync } from '../lib/hooks';
import { LoadingScreen } from '../components/ui/LoadingScreen';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, role } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === '(auth)';
    const inParentGroup = firstSegment === '(parent)';
    const inChildGroup = firstSegment === '(child)';
    const onChildPin = (segments as string[]).includes('child-pin');

    if (!isAuthenticated && !inAuthGroup) {
      router.navigate('/(auth)/login');
    } else if (isAuthenticated) {
      const target = role === 'child' ? '/(child)' : '/(parent)';

      if (inAuthGroup && !onChildPin) {
        // Redirect away from auth group (except child-pin)
        router.navigate(target);
      } else if (!inParentGroup && !inChildGroup && !inAuthGroup) {
        // At root index or unknown route — redirect to correct group
        router.navigate(target);
      }
    }
  }, [isAuthenticated, isLoading, role, segments]);

  return null;
}

function DataSubscriptions() {
  useSubscriptions();
  useGoalBudgetSync();
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
          <LoadingScreen message="Starting Galo Routine..." />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="light" />
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
