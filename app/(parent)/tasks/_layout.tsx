import { Stack } from 'expo-router';
import { ChildColors } from '../../../constants/childTheme';

export default function TasksLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: ChildColors.galoBlack },
        headerTintColor: ChildColors.textPrimary,
        contentStyle: { backgroundColor: ChildColors.galoBlack },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Tarefas' }} />
      <Stack.Screen name="new" options={{ title: 'Nova Tarefa', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Editar Tarefa' }} />
      <Stack.Screen name="templates" options={{ title: 'Modelos de Tarefa', presentation: 'modal' }} />
    </Stack>
  );
}
