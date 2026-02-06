import { Stack } from 'expo-router';
import { ChildColors } from '../../../constants/childTheme';

export default function PeriodsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: ChildColors.galoBlack },
        headerTintColor: ChildColors.textPrimary,
        contentStyle: { backgroundColor: ChildColors.galoBlack },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Períodos' }} />
      <Stack.Screen name="history" options={{ title: 'Histórico' }} />
    </Stack>
  );
}
