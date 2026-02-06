import { Stack } from 'expo-router';
import { ChildColors } from '../../../constants/childTheme';

export default function RewardsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: ChildColors.galoBlack },
        headerTintColor: ChildColors.textPrimary,
        contentStyle: { backgroundColor: ChildColors.galoBlack },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Prêmios' }} />
      <Stack.Screen name="new" options={{ title: 'Novo Prêmio' }} />
      <Stack.Screen name="[id]" options={{ title: 'Editar Prêmio' }} />
      <Stack.Screen name="history" options={{ title: 'Histórico de Resgates' }} />
    </Stack>
  );
}
