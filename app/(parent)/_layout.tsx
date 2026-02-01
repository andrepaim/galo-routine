import { Tabs } from 'expo-router';
import { Icon } from 'react-native-paper';
import { Colors } from '../../constants';

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: { backgroundColor: Colors.surface },
        headerStyle: { backgroundColor: Colors.primaryContainer },
        headerTintColor: Colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon source="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon source="format-list-checks" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color, size }) => (
            <Icon source="check-decagram" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="periods"
        options={{
          title: 'Periods',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon source="calendar-range" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon source="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
