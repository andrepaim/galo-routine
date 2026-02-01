import { Stack } from 'expo-router';
import { Colors } from '../../constants';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primaryContainer },
        headerTintColor: Colors.text,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Welcome', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Create Family Account' }} />
      <Stack.Screen name="child-pin" options={{ title: 'Child Mode', headerShown: false }} />
    </Stack>
  );
}
