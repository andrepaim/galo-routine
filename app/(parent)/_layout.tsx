import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import { ChildColors, ChildSizes } from '../../constants';

export default function ParentLayout() {
  const router = useRouter();

  const switchToChild = () => {
    router.replace('/(auth)/child-pin');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ChildColors.starGold,
        tabBarInactiveTintColor: ChildColors.tabInactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTintColor: ChildColors.textPrimary,
        headerTitleStyle: styles.headerTitle,
        headerRight: () => (
          <TouchableOpacity onPress={switchToChild} style={styles.headerRightContainer}>
            <Icon source="account-child" size={24} color={ChildColors.textPrimary} />
          </TouchableOpacity>
        ),
      }}
    >
      {/* Main Tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ color }) => (
            <Icon source="clipboard-list" size={ChildSizes.tabIconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Gerenciar',
          tabBarIcon: ({ color }) => (
            <Icon source="cog" size={ChildSizes.tabIconSize} color={color} />
          ),
        }}
      />
      
      {/* Hidden routes - keep for deep linking but don't show in tab bar */}
      <Tabs.Screen
        name="tasks"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="periods"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: ChildColors.tabBackground,
    borderTopWidth: 0,
    height: ChildSizes.tabBarHeight,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: ChildColors.shadowColor,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  header: {
    backgroundColor: ChildColors.galoBlack,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    color: ChildColors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
  },
  headerRightContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});