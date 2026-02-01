import { Stack } from 'expo-router';
import { Colors } from '../../../constants';

export default function TasksLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primaryContainer },
        headerTintColor: Colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Tasks' }} />
      <Stack.Screen name="new" options={{ title: 'New Task', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit Task' }} />
    </Stack>
  );
}
