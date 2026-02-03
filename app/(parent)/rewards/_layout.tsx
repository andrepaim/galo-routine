import { Stack } from 'expo-router';
import { Colors } from '../../../constants';

export default function RewardsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primaryContainer },
        headerTintColor: Colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Rewards' }} />
      <Stack.Screen name="new" options={{ title: 'New Reward' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit Reward' }} />
      <Stack.Screen name="history" options={{ title: 'Redemption History' }} />
    </Stack>
  );
}
