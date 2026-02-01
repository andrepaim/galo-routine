import { Tabs } from 'expo-router';
import { Icon } from 'react-native-paper';
import { Colors } from '../../constants';

export default function ChildLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          height: 64,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: 'bold',
        },
        headerStyle: { backgroundColor: Colors.secondaryContainer },
        headerTintColor: Colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <Icon source="star-face" size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'My Tasks',
          tabBarIcon: ({ color, size }) => (
            <Icon source="format-list-checks" size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stars"
        options={{
          title: 'My Stars',
          tabBarIcon: ({ color, size }) => (
            <Icon source="star-shooting" size={size + 4} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
