import { Stack } from 'expo-router';
import { ChildColors } from '../../constants/childTheme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: ChildColors.galoBlack },
        headerTintColor: ChildColors.textPrimary,
        contentStyle: { backgroundColor: ChildColors.galoBlack },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Bem-vindo', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Criar Conta' }} />
      <Stack.Screen name="child-pin" options={{ title: 'Modo Criança', headerShown: false }} />
    </Stack>
  );
}
