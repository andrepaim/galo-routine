import { Tabs, useRouter } from 'expo-router';
import { Icon, IconButton } from 'react-native-paper';
import { Colors } from '../../constants';
import { useAuthStore } from '../../lib/stores';

export default function ChildLayout() {
  const router = useRouter();
  const setRole = useAuthStore((s) => s.setRole);

  const switchToParent = async () => {
    await setRole('parent');
    router.replace('/(parent)');
  };

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
          fontSize: 12,
          fontWeight: 'bold',
        },
        headerStyle: { backgroundColor: Colors.secondaryContainer },
        headerTintColor: Colors.text,
        headerRight: () => (
          <IconButton
            icon="account-switch"
            iconColor={Colors.primary}
            size={24}
            onPress={switchToParent}
          />
        ),
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
          title: 'Stars',
          tabBarIcon: ({ color, size }) => (
            <Icon source="star-shooting" size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => (
            <Icon source="gift" size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="badges"
        options={{
          title: 'Badges',
          tabBarIcon: ({ color, size }) => (
            <Icon source="shield-star" size={size + 4} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => (
            <Icon source="account-circle" size={size + 4} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
