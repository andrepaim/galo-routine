import { Stack } from 'expo-router';
import { Colors } from '../../../constants';

export default function PeriodsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primaryContainer },
        headerTintColor: Colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Current Period' }} />
      <Stack.Screen name="history" options={{ title: 'Period History' }} />
    </Stack>
  );
}
